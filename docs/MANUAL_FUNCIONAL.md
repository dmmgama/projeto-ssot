# Mapeamento Formulário · SSOT JSJ

Este documento descreve a estrutura hierárquica e funcional do formulário único de projeto (“SSOT JSJ”). Cada nível representa um grupo de dados e funcionalidades correlacionadas. Objetivo: servir de referência para integração, automação e contexto para LLMs.

---

## Nível 1 · Identificação do Projeto

### 1.1 KPIs Rápidos (Visualização)
**Output:** ID, Nome, Fase

### 1.2 Campos Principais (Administrativo)
**Inputs:**
- ID JSJ  
- Nome Projeto JSJ  
- Cliente  
- Designação  
- Localização: País (Dropdown), Cidade (Dropdown), Morada  
- Tipologia (Dropdown)  
- Especialidade  
- Tipo de Obra  
- Fase Atual  

### 1.3 Acompanhamento de Fases (Tabela Dinâmica)
**Fases:** EP, Licenciamento, Execução, Assistência Técnica  
**Dados:** Data de Entrega, Estado (Dropdown)

### 1.4 Equipa do Projeto JSJ
**Inputs:** Resp. Técnico, Equipa Eng., BIM, Gestão, Fiscalização, Promotor, Arquitetura, Especialidades, BIM Manager

### 1.5 Equipa do Projeto Dono de Obra
**Inputs:** Dono de Obra, Arquitetura, Gestão de Projeto, Especialidades, BIM Manager, Fiscalização, 

---

## Nível 2 · Caracterização Geral da Obra

### 2.1 Resumo Geral (KPIs Automáticos)
**Outputs:** Implantação (m²), ABC (m²), Nº Pisos, Altura Total (m)

### 2.2 Gestão de Pisos e Zonas (Estrutura Dinâmica)
**Piso**
- Nome  
- Cota  
- Área  
- Imagem (PNG, JPG)

---

## Nível 3 · Elementos Base

### 3.1 Elementos Base (Histórico)
**Campos:**  
Arquitetura, MEP, Escavação, Estudo Geotécnico/Hidro, Prospeções, Caracterização/Inspeção Estrutural, Ensaios, Projetos Originais

---

## Nível 4 · Condicionantes

### 4.1 Condições Arquitetónicas
**Área de Texto:** Condicionantes Principais (pés-direitos, vãos, restrições)

### 4.2 Condicionantes Geotécnicas

#### 4.2.1 Caracterização Geológica
**Inputs:**  
Formações, Horizontes, Prof. Substrato, Natureza, Tipo Solo EC8 (Dropdown), σadm

#### 4.2.2 Parâmetros por Horizonte (Tabela)
**Colunas:** Horizonte, NSPT, γ, c', φ, E, σadm, Escavabilidade

### 4.3 Condições Hidrogeológicas
**Inputs:** Nível Freático, Coluna Água, Agressividade (XA), Observações

---

## Nível 5 · Solução Estrutural

### 5.1 Descrição da Solução
**Área de Texto:** Sistema estrutural, materiais, fundações

---

## Nível 6 · Ações (Motor de Cálculo)

### 6.1 Seleção de Ações (Quadro 1)
**Checkboxes:**  
Gravíticas (Mandatory), Sismo, Vento, Impulsos, Retração, Temperatura, Neve, Água

### 6.2 Detalhamento de Ações (Quadro 2)

#### A) Gravíticas (Análise Analítica v9.0)
- Seletor de Piso  
- Visualizador 2D (Canvas): Modos Lajes, Sobrecargas, RCP, Combinações, Heatmap ELU, Sonda, Pré-Dim.

#### B) Ação Sísmica (EC8)
- **Parâmetros:** Zona, Terreno (Importado), Importância, Coef. q, Amortecimento  
- **Gráficos:** Espectros Tipo 1 e Tipo 2 (Chart.js)

#### C) Ação do Vento (EC1-1-4)
- Zona, vb,0, Categoria, z0, co, cpi

#### D) Impulsos de Terras
- Altura, γ, φ, c, K0, q

#### E) Retração/Fluência
- HR, t0, Tipo Cimento, Cura

#### F) Temperatura
- ΔT Contração/Expansão, α, T ref.

#### G) Neve (EC1-1-3)
- Zona, Altitude, sk, Ce, Ct, μ

#### H) Água
- Nível, γw, Subpressões, Drenagem

---

## Nível 7 · Critérios e Relatórios

### 7.1 Critérios de Segurança
**Campos:** Regulamentação, Critérios Dimensionamento (ELU/ELS)

### 7.2 Exportação e Outputs
**Funcionalidades:**  
Gerar Relatório Markdown, Exportar/Importar JSON
