# Roadmap — Fases Seguintes

*Cada fase abaixo lista o que ela cobre e o que precisa ser decidido **antes** de começar a codificá-la. Nenhum desses pontos precisa de decisão hoje — o risco real é começar a codificar uma fase sem revisitar esta lista primeiro.*

## Fase 1 — Fundação de Estoque ✅ (em andamento neste repositório)

Bounded context de Inventário: `BloodBag`, `BloodComponent`, `Equipment`. Ver `docs/fase-1.md` para detalhes e limitações conhecidas.

## Fase 2 — Doação & Triagem (não iniciada)

**O que essa fase cobre:** cadastro de doador, agendamento, triagem clínica, exames laboratoriais, motor de questionário de elegibilidade.

**Pontos a discutir antes de começar:**
- Jornadas de usuário completas do fluxo de doação (recepção → cadastro → triagem clínica → triagem hematológica → coleta → repouso → liberação) — ver FLUXO-OPERACIONAL.md, Fluxo 1.
- Casos de uso (UC) formais de cadastro de doador, triagem e agendamento, com pré-condições e fluxos alternativos.
- Motor de questionário clínico **configurável por tenant**, não hardcoded — critérios de exclusão mudam com frequência.
- Extensão do mecanismo offline-first para este contexto: é aqui que a `BloodBag` nasce fisicamente, então a numeração ISBT 128 pré-alocada por dispositivo (decidida para Inventário) precisa ser estendida para cá.
- Profundidade clínica ainda não modelada: aférese, doação autóloga, doação dirigida, janelas de detecção por método de exame (NAT vs. sorologia convencional).
- Integração real com o evento `DonationCollected` que a Fase 1 hoje só simula como input direto do `RegisterBloodBagUseCase`.

## Fase 3 — Distribuição (não iniciada)

**O que essa fase cobre:** solicitação hospitalar, crossmatch, alocação, transporte.

**Pontos a discutir antes de começar:**
- Casos de uso de solicitação hospitalar e orquestração de crossmatch (o sistema orquestra o fluxo; o teste físico de compatibilidade continua sendo laboratorial).
- Fenotipagem estendida e hemocomponentes especiais (irradiado, leucorreduzido) para pacientes politransfundidos — ainda não modelado em `BloodType`.
- Diferenciação prática entre reserva eletiva e emergencial na jornada do hospital parceiro — os timeouts já existem no domínio (`Reservation`), mas ainda estão hardcoded (ver `docs/fase-1.md`, seção 4); precisam virar configuração por tenant/hospital aqui.
- Controle de temperatura durante o transporte (fora do hemocentro, em caixas térmicas móveis) — hoje só cobrimos cadeia de frio dentro do hemocentro (`Equipment`); em trânsito é gap novo, identificado em PROPOSITO-PITCH.md.
- Padrão de integração com hospitais: REST simples vs. HL7/FHIR — decisão ainda em aberto.

## Fase 4 — Rede & Intercâmbio (não iniciada)

**O que essa fase cobre:** troca de excedente entre hemocentros parceiros antes do descarte.

**Pontos a discutir antes de começar:**
- Modelagem do bounded context como exceção controlada ao isolamento multi-tenant (ver ARQUITETURA.md) — expõe apenas tipo/quantidade/validade, nunca dados de doador.
- Validar com um piloto pequeno (2-3 tenants do mesmo grupo) antes de generalizar — intercâmbio entre concorrentes desconhecidos pode ser resistido comercialmente.
- `ComponentOfferedForExchangeEvent` já existe no domínio de Inventário (Fase 1) como ponto de saída — falta o bounded context que o consome.

## Fase 5 — Analytics (não iniciada)

**O que essa fase cobre:** previsão sazonal de estoque, matching de campanhas de doação por criticidade, relatórios de causa-raiz de descarte.

**Pontos a discutir antes de começar:**
- Ainda é só visão declarada (PRODUTO.md) — nenhum desenho técnico existe.
- Depende de volume real de dados históricos das Fases 1-3 rodando em produção antes de fazer sentido investir aqui.

## Transversal — Antes de Qualquer Ambiente de Produção Real (independente da fase)

- RBAC completo (papéis, permissões por transição de estado — ex.: quem pode autorizar um descarte).
- Criptografia por tenant, rotação de chaves, assinatura digital de laudos.
- MFA, retenção e anonimização de dados sob LGPD, estratégia de backup/disaster recovery.
- Relatório automático no formato HEMOPROD para envio às Vigilâncias Sanitárias.
- Acompanhamento da revisão da RDC 34/2014 e da vigência da Portaria GM/MS nº 11.685/2026 (30/09/2026) — regras de compliance não devem ser tratadas como definitivas.
