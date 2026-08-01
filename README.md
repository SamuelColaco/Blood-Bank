# Blood Bank System

Sistema multi-tenant de gestão de banco de sangue, com regras de negócio de compliance embutidas no domínio (não em validação de formulário) e rastreabilidade de ponta a ponta do ciclo do sangue.

> Este repositório contém a **Fase 1 (Fundação de Estoque)** — o bounded context de **Inventário**. As demais fases (Doação & Triagem, Distribuição, Rede & Intercâmbio) ainda não foram iniciadas — ver `docs/roadmap.md`.

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20+ LTS |
| Framework | NestJS sobre Fastify |
| Linguagem | TypeScript (strict mode) |
| Validação de entrada | zod |
| ORM / Migrations | Prisma |
| Testes | vitest |
| Enforcement de arquitetura | dependency-cruiser |
| Banco de dados | PostgreSQL |

## Princípios Arquiteturais (não negociáveis)

1. **Domínio 100% puro.** `src/modules/*/domain/` nunca importa NestJS, Prisma, ou qualquer pacote de infraestrutura. Isso não é convenção — é regra de CI (`npm run lint:architecture`, via `.dependency-cruiser.js`). Um PR que viole essa regra quebra o build.
2. **Compliance é regra de domínio, não middleware.** Transições de estado como liberação de quarentena, cálculo de validade e a exigência de motivo obrigatório para descarte vivem nos Aggregates, não em validadores externos.
3. **Auditoria via transactional outbox.** Todo caso de uso escreve o evento de domínio na tabela `outbox_events` na mesma transação em que altera o estado do agregado. Um worker assíncrono (fora do escopo desta fase) processa essa tabela e grava em `audit_logs` — sem nunca adicionar latência de rede síncrona à rota HTTP normal.
4. **Bolsa e Componente são Aggregates separados.** `BloodBag` tem vida transacional curta (só durante a coleta/fracionamento); `BloodComponent` é a unidade real de operação — quarentena, reserva, alocação e descarte acontecem por componente, de forma independente.

Essas decisões — e o porquê de cada uma — estão detalhadas em `docs/fase-1.md`.

## Estrutura de Pastas

```
src/
├── shared/domain/                  # AggregateRoot, DomainEvent, DomainError — base para todos os módulos
└── modules/
    └── inventory/                  # Bounded Context de Inventário
        ├── domain/                 # Entidades, VOs, eventos, serviços, ports de repositório — TS puro
        ├── application/            # Casos de uso, ports de aplicação, event handlers
        ├── infrastructure/         # Repositórios Prisma, outbox writer, módulo NestJS
        └── presentation/           # Controller HTTP, DTOs (zod)
```

## Como Rodar

```bash
npm install
cp .env.example .env        # configurar DATABASE_URL
npx prisma generate
npx prisma migrate dev      # cria as tabelas a partir de prisma/schema.prisma
npm run test                # roda os 15 testes unitários de domínio
npm run lint:architecture   # confirma que o domínio continua puro
npm run start:dev
```

## Escopo Deliberadamente Fora Desta Fase (e do produto, por ora)

Regras médicas cinzentas que dependem de validação clínica externa — como liberação condicional de plaquetas sob escassez crítica, ou qualquer variante do tipo da Resolução CFM nº 2.464/2026 (PRP) — **não fazem parte do domínio modelado aqui**. Essa foi uma decisão consciente da equipe: o ciclo do `BloodComponent` permanece simples e seguro (`IN_QUARANTINE → CLEARED | REJECTED`, sem estado intermediário). Só volta à mesa se um comitê clínico assumir formalmente a responsabilidade pela regra.

## Documentação

- `docs/fase-1.md` — decisões técnicas detalhadas desta fase (schema, auditoria, offline-first, etc.)
- `docs/roadmap.md` — fases seguintes e pontos a discutir antes de cada uma
