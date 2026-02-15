# 🤖 MANIFESTO MESTRE: Template Edifício JSJ
Status: Documentação Viva
Versão Actual: v11.1 (Supabase Backend + Schema Blocos)
Objectivo: Guia central para Agentes de Código e Developers.
Última Actualização: 15/02/2026

🚨 PROTOCOLO DE INICIALIZAÇÃO (Boot Sequence)
Sempre que iniciares uma sessão ou fores instruído a trabalhar neste projecto, segue esta ordem:

Identificar a Versão Actual: Procura na raiz o ficheiro principal (Index_v11.1.html). Verifica <title> ou variável version.
Ler Contexto (Pela ordem abaixo):

ESPECIFICACAO.md — Schema PostgreSQL completo, API Supabase, fluxos de dados, hierarquia Blocos, motor gráfico
RISCOS.md — CRÍTICO. IDs/funções protegidas, dependências cruzadas, riscos RLS/Storage. Lê ANTES de alterar qualquer código.
TESTES.md — Casos de teste obrigatórios (regressão, integração, Supabase auth/sync/storage)
GUIDELINES.md — Padrões de código, naming, boas práticas Supabase
ROADMAP.md — Objectivos futuros (opcional, contexto estratégico)


Referência funcional (se precisares entender o "quê" sem o "como"):

MANUAL_FUNCIONAL.md — Hierarquia funcional do formulário (8 secções + Blocos)




🧭 Princípios de Desenvolvimento

SSOT (Single Source of Truth): O objecto global projectData é a fonte de verdade. O HTML é reflexo visual. Nunca ler do DOM para cálculos — ler de projectData.
Continuidade Gráfica: Alterações em pisos ou zonas devem ser validadas contra zonas.html (Editor Gráfico) via postMessage.
Relações PostgreSQL: Hierarquia Blocos → Pisos → Zonas respeitada via foreign keys. DELETE CASCADE automático.
Supabase-First (v11.1): Persistência é PostgreSQL. Funções CRUD são async — sempre usar await. RLS policies validam ownership. Realtime subscriptions devem ser limpos em beforeunload.
Lazy Loading Obrigatório: Imagens carregam on-demand (Viewer), nunca eager load (lobby).
Protótipos Isolados: Tecnologia nova (ex: OpenCV) → ficheiro standalone FORA do SSOT.


🗺️ Mapa de Ficheiros
Aplicação Core
FicheiroDescriçãoVersãoIndex_v11.1.htmlCore App (UI + Lógica + Estado + Supabase integration)v11.1lobby.htmlGestão multi-projecto (grid + CRUD Supabase)v11.1login.htmlSupabase Auth UI (email/password + magic link)v11.1supabase-config.jsSupabase Client init + Auth configv11.1supabase-data.jsPostgreSQL CRUD + Storage + Realtimev11.1zonas.htmlEditor Canvas isolado (popup)v9.0+
Migration
FicheiroDescriçãoStatusmigrate-firebase-to-supabase.htmlMigration script Firestore→SupabaseOne-time manual
Protótipos
FicheiroDescriçãoStatuscolor-trace-prototype.htmlOpenCV auto-traceNão integra SSOT
Documentação (7 ficheiros)
FicheiroConteúdoMASTER.mdEste ficheiro. Boot sequence + mapaESPECIFICACAO.mdSchema PostgreSQL, API Supabase, fluxos, motor gráficoRISCOS.mdIDs protegidos, funções críticas, riscos RLS/StorageTESTES.mdSuite de testes (regressão + integração + Supabase)GUIDELINES.mdNaming, code style, padrões SupabaseROADMAP.mdFases de evolução (v11.1 → v14.0)MANUAL_FUNCIONAL.mdHierarquia funcional (8 secções + Blocos)

⚡ Referência Rápida: O Que Consultar Quando
SituaçãoDocumentoPreciso entender o schema PostgreSQL / hierarquia BlocosESPECIFICACAO.md §2Vou alterar um ID HTML ou funçãoRISCOS.md §2-3Vou mexer em actions_data ou FloorViewerRISCOS.md §1 + ESPECIFICACAO.md §6Vou mexer em Supabase/PostgreSQLRISCOS.md §9 + ESPECIFICACAO.md §5Vou mexer em Storage/lazy loadingRISCOS.md §10 + ESPECIFICACAO.md §4.2Vou mexer em RLS policiesRISCOS.md §9.1 + ESPECIFICACAO.md §2.2Preciso testar alteraçõesTESTES.mdDúvida de naming ou code styleGUIDELINES.mdPlaneamento futuroROADMAP.md

🆕 Mudanças v11.0 → v11.1
Stack

❌ Firebase (Auth, Firestore, Storage)
✅ Supabase (Auth, PostgreSQL, Storage, Realtime)

Schema

❌ Floors array flat
✅ Hierarquia relacional: Projecto → Blocos → Pisos → Zonas

Auth

❌ Firebase Auth (@jsj.pt whitelist via Firestore Rules)
✅ Supabase Auth (@jsj.pt whitelist via SQL trigger)

Persistência

❌ Firestore documents (1MB limit, nested arrays sanitization)
✅ PostgreSQL rows (ilimitadas, JSONB nativo, foreign keys)

Security

❌ Firestore Rules (document-level)
✅ Row Level Security (RLS policies, table-level)

Real-time

❌ Firestore onSnapshot (document-level granular)
✅ Supabase Realtime (table-level, PostgreSQL WAL)

Storage

❌ Base64 inline em docs Firestore
✅ Supabase Storage (lazy load, signed URLs TTL 7 dias)

CRUD

❌ Funções Firebase (sanitizeNestedArrays, deserializeNestedStrings)
✅ Funções Supabase (queries SQL, upsert, JOINs)


🔥 Alertas Críticos v11.1
🚨 Breaking Changes

Auth: Re-login obrigatório (Firebase sessions invalidadas)
Schema: JSONs v11.0 incompatíveis (migration script manual)
IDs: UUIDs PostgreSQL (não timestamps Date.now())
Storage: Paths Supabase Storage (não Base64 inline)

🛡️ Security

RLS: SEMPRE testar com 2 users (@jsj.pt diferentes)
Storage Policies: Validam ownership via Firestore lookup
Foreign Keys CASCADE: Apagar project → apaga TUDO (blocos/pisos/zonas)

⚡ Performance

Lazy Load: NUNCA eager load imagens
Realtime: Cleanup subscriptions em beforeunload
Queries: JOINs são rápidos, mas evitar N+1 (usar SELECT com nested)

🧪 Testing

RLS: Ownership validation obrigatória
Storage: Upload/Download/Delete cycle
Cascade: Validar delete hierarchy


📋 Hierarquia Blocos (v11.1) 🆕
Projecto
└─ Blocos (N)
   ├─ Pisos (N)
   │  ├─ Tipologia: Fundações | Enterrados | Elevação | Cobertura
   │  ├─ Campos editáveis: nome, cota, tipologia
   │  ├─ Imagem (Supabase Storage, lazy load)
   │  └─ Zonas (N)
   │     └─ Uso EC1, lajes, permanentes, walls
   └─ Geo Horizons (N) — futuro: por bloco
Tabelas PostgreSQL:

projects (1) → blocos (N) → pisos (N) → zonas (N)
projects (1) → geo_horizons (N)
projects (1) → project_files (N) — catálogo servidor legacy

Foreign Keys: ON DELETE CASCADE (apagar parent → apaga children)

🔄 Fluxo de Trabalho Típico
Desenvolvimento Nova Feature

Lê RISCOS.md — identifica IDs/funções críticas
Lê ESPECIFICACAO.md — entende schema/API
Implementa código
Testa via TESTES.md — regressão + integração
Actualiza RISCOS.md se novos IDs/funções críticas
Commit com mensagem feat(scope): descrição (ver GUIDELINES.md §7)

Bug Fix

Reproduz bug via TESTES.md
Lê RISCOS.md — valida não afecta funções protegidas
Fix código
Re-testa via TESTES.md
Commit com mensagem fix(scope): descrição

Refactor

STOP — lê RISCOS.md §1 (tabela impactos)
Valida se mexe em origem crítica (ex: projectData.blocos)
Se SIM → testa TODOS os impactos listados
Se NÃO → procede com cuidado
Commit com mensagem refactor(scope): descrição


🎯 Quick Start (Novo Developer)
bash# 1. Clone repo
git clone <repo-url>

# 2. Lê documentação (ordem)
cat MASTER.md          # Este ficheiro
cat ESPECIFICACAO.md   # Schema + API
cat RISCOS.md          # O que NÃO tocar

# 3. Setup Supabase
# - Cria projeto Supabase (https://supabase.com)
# - Copia schema SQL de ESPECIFICACAO.md §2
# - Deploy RLS policies de ESPECIFICACAO.md §2.2
# - Deploy Storage policies de ESPECIFICACAO.md §5.3
# - Deploy SQL trigger whitelist de ESPECIFICACAO.md §2.3

# 4. Config local
# - Edita supabase-config.js com tuas credenciais
# - Supabase Dashboard → Settings → API → anon key + URL

# 5. Abre Index_v11.1.html no browser
# - Autentica com email @jsj.pt
# - Cria primeiro projeto
# - Testa CRUD blocos/pisos/zonas

# 6. Valida via TESTES.md
# - Executa §1.1 (Persistência)
# - Executa §1.6 (Auth)
# - Executa §1.7 (Real-time)

📚 Leitura Complementar
Para Agentes de Código

ESPECIFICACAO.md — Schema completo + API reference
RISCOS.md — Dependências críticas
GUIDELINES.md — Code style

Para Architects/Leads

ROADMAP.md — Visão estratégica
ESPECIFICACAO.md §1 — Arquitectura high-level

Para QA/Testers

TESTES.md — Suite completa
RISCOS.md §8 — Checklist pré-alteração

Para Novos Developers

MASTER.md — Este ficheiro (começar aqui)
MANUAL_FUNCIONAL.md — Hierarquia funcional UI


Ao leres este ficheiro, assume a persona de "Senior Lead Developer" da JSJ: pragmático, focado na escalabilidade e obcecado por não quebrar código legado.
Próxima leitura: ESPECIFICACAO.md para schema técnico completo
Última actualização: 15/02/2026 (v11.1)
</document>