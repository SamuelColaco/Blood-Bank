# Fase 1 — Fundação de Estoque

*Documento técnico do que está implementado neste repositório. Consolida e substitui as versões anteriores dispersas em FASE1-FUNDACAO.md e DECISOES-HOTSPOTS.md — aqui refletem o código real, não só o plano.*

## Escopo Fechado

Regras médicas que dependem de validação clínica externa (liberação condicional de plaquetas sob escassez, PRP/Resolução CFM nº 2.464/2026, e qualquer variante do mesmo tipo) estão **fora do escopo do produto**, por decisão consciente da equipe. O ciclo do `BloodComponent` é: `IN_QUARANTINE → CLEARED | REJECTED`, sem estado intermediário. Revisitar isso exige um comitê clínico assumindo formalmente a responsabilidade pela regra — não é uma decisão de produto ou engenharia.

## 1. Por que `BloodBag` e `BloodComponent` são Aggregates separados

Esta é a decisão de modelagem mais importante do domínio. Quarentena, reserva, alocação, expiração e descarte acontecem **por componente**, de forma independente — uma bolsa gera até 4 componentes (hemácias, plaquetas, plasma, crioprecipitado) com validades e destinos completamente diferentes. Se `BloodComponent` fosse entidade filha de `BloodBag`, qualquer operação em um componente exigiria carregar/travar o agregado `BloodBag` inteiro, criando contenção desnecessária.

`BloodBag` (`src/modules/inventory/domain/entities/blood-bag.entity.ts`) tem vida transacional curta: depois que `markAsFinalized()` é chamado, ela deixa de ser modificada e passa a existir só como registro de proveniência para rastreabilidade.

`BloodComponent` (`.../blood-component.entity.ts`) é a unidade real de operação, com a seguinte máquina de estados (toda transição é validada por `assertStatus`, sem atalhos):

```
SEPARATED → IN_QUARANTINE → CLEARED → STORED → RESERVED → ALLOCATED
                          → REJECTED           → OFFERED_FOR_EXCHANGE
                                               → EXPIRED → DISCARDED
```

## 2. Por que a temperatura não fica no `BloodComponent`

Uma falha de equipamento (freezer, geladeira, agitador de plaqueta) pode afetar dezenas de componentes simultaneamente. Se a leitura de temperatura "atual" morasse em cada linha de componente, cada leitura de sensor viraria um `UPDATE` disparado sobre dezenas de linhas ao mesmo tempo.

Solução implementada: `Equipment` (`.../entities/equipment.entity.ts`) avalia a leitura e, se estiver fora da faixa seguraça, levanta `TemperatureOutOfRangeDetectedEvent` — sem tocar em nenhum `BloodComponent` diretamente. O consumo desse evento é responsabilidade do `TemperatureOutOfRangeHandler` (`application/event-handlers/`), que busca os componentes armazenados naquele equipamento e chama `flagForReevaluation()` em cada um, individualmente. Isso é **consistência eventual por design**, não transacional: há uma janela entre a detecção da falha e todos os componentes sendo marcados, mas a ação corretiva real (isolar os itens fisicamente) já acontece no mundo físico antes do sistema refletir o estado.

**Limitação atual conhecida:** `IBloodComponentRepository.findStoredInEquipment` ainda não tem uma coluna real de vínculo equipamento↔componente no schema (ver comentário no `BloodComponentPrismaRepository`). Isso é um placeholder até essa relação existir — não bloqueia a Fase 1, mas precisa ser resolvido antes do `TemperatureOutOfRangeHandler` funcionar corretamente em produção.

## 3. Auditoria como Transactional Outbox

Implementado em `OutboxEventPrismaWriter` (`infrastructure/persistence/outbox-event.prisma-writer.ts`). Todo caso de uso segue o mesmo padrão:

```
1. Carrega o agregado
2. Chama o método de domínio (ex.: component.releaseFromQuarantine())
3. Salva o agregado via repositório
4. Escreve os eventos do agregado (component.pullDomainEvents()) na outbox
```

**Limitação atual conhecida, documentada no próprio código:** para ser um outbox transacional de verdade, os passos 3 e 4 precisam rodar dentro do mesmo `prisma.$transaction(...)`. Neste scaffold, cada repositório abre sua própria operação Prisma — unificar isso numa transação compartilhada é o primeiro item prático de implementação real (ver `README.md`, "Como Rodar", e a lista de próximos passos abaixo). Deixar isso como TODO explícito é intencional: preencher com uma implementação que *parece* pronta mas não garante a propriedade que o outbox existe para dar é pior do que marcar a lacuna.

Uma vez a `outbox_events` populada, um worker assíncrono (fora do escopo desta fase) a processa e grava em `audit_logs` — tabela append-only, sem permissão de `UPDATE`/`DELETE` a nível de banco em produção.

## 4. Reservas — dois perfis de timeout

Implementado em `Reservation` (`domain/value-objects/reservation.vo.ts`) e usado por `ReserveComponentUseCase`. Dois perfis:
- **Eletiva**: timeout em dias (padrão atual: 3 dias, hardcoded — ver limitação abaixo).
- **Emergencial**: timeout em horas (padrão atual: 2 horas).

**Limitação atual conhecida:** os valores de timeout estão hardcoded no use case (`ELECTIVE_RESERVATION_TIMEOUT_DAYS`, `EMERGENCY_RESERVATION_TIMEOUT_HOURS`) porque a Fase 1 ainda não tem mecanismo de configuração por tenant. Isso precisa virar configuração (`tenants.featureFlags` ou uma tabela própria) antes da Fase 3 (Distribuição), quando reservas passam a ser acionadas por hospitais reais.

## 5. Testes

`test/domain/validity-calculator.service.spec.ts` — confirma os dias de validade por tipo de componente (plaquetas 5d, hemácias 42d, plasma 365d) e a detecção correta de expiração.

`test/domain/blood-component.entity.spec.ts` — confirma que: todo componente entra em quarentena imediatamente ao ser separado; a liberação de quarentena não pode ser chamada duas vezes; um componente não pode ser armazenado sem antes ser liberado; o caminho feliz completo (quarentena → liberado → armazenado → reservado → alocado) funciona; um componente vencido não pode ser reservado mesmo que seu status ainda seja `STORED`; descarte exige motivo explícito e não pode ser chamado duas vezes; sinalizar para reavaliação não muda o status (confirmação humana continua necessária).

Rodar com `npm run test` — 15 testes, todos passando.

## 6. Enforcement de Arquitetura

`.dependency-cruiser.js` define três regras: domínio não pode importar `@nestjs/*`; domínio não pode importar Prisma; dependências apontam sempre para dentro (domínio nunca importa de `application/`, `infrastructure/` ou `presentation/`). Rodar com `npm run lint:architecture` — confirmado sem violações neste repositório (50 módulos, 149 dependências cruzadas).

## Próximos Passos Práticos (nesta ordem)

1. Unificar `save()` do repositório + `write()` do outbox numa única transação Prisma (`prisma.$transaction`) — fecha a lacuna da seção 3.
2. Adicionar a coluna/relação de vínculo equipamento↔componente ao schema — fecha a lacuna da seção 2.
3. Mover os timeouts de reserva de constante hardcoded para configuração por tenant.
4. Escrever os testes de integração dos repositórios Prisma (hoje só o domínio tem teste automatizado).
5. Só depois disso, começar a Fase 2 — ver `docs/roadmap.md`.
