🏛️ ARQUITETURA DO SISTEMA (Agnóstica)

## 1. O Objeto de Estado (`projectData`)
A aplicação não possui base de dados (atualmente). O estado vive numa variável global em memória.
**Estrutura Base:**
```javascript
let projectData = {
  floors: [
    {
      id: 123456789,      // Timestamp único
      name: "Piso 0",
      cota: 0.00,
      area: 150.00,
      zones: [            // Array de zonas dentro do piso
        {
          id: 987654321,
          name: "Zona A",
          uso: "B",        // Categoria EC1 (importante para Secção 7)
          tipoLaje: "Maciça",
          permanentes: [], // Cargas manuais
          walls: []        // Paredes divisórias
        }
      ],
      actionsData: { ... } // DADOS CRÍTICOS: Geometria importada do editor gráfico
    }
  ],
  geoHorizons: [],         // Dados da tabela da Secção 5
  actionsEnabled: { ... }  // Booleans (ex: sismo: true) que ligam/desligam abas na UI
};


2. Ciclo de Vida dos Dados
Input: User digita no HTML -> Evento onchange dispara atualização no projectData ou recalcula UI local.

Cálculo (Secção 7 - Ações):

Motor Analítico: renderZoneActions(floor, zone) lê zone.uso, aplica regras EC1 (hardcoded em getUsoCategoryData) e gera HTML.

Motor Gráfico: FloorViewer lê actionsData e recalcula cargas por pixel/polígono.

Persistência (IO):

collectAllData(): Varre o DOM por IDs e serializa para JSON.

loadAllData(): Recebe JSON e repovoa o DOM e o projectData.

3. O Módulo Gráfico (FloorViewer & zonas.html)
O sistema usa uma arquitetura de "Satélite":

Viewer (Index.html): readonly. Usa a classe FloorViewer para desenhar no Canvas.

Lógica: calculatePointELU(point) verifica polígonos ativos e soma cargas (Laje + Sobrecarga + Paredes).

Editor (zonas.html): Janela popup independente.

Envio: Index guarda dados na sessionStorage ou envia via postMessage.

Retorno: zonas.html envia postMessage com payload { type: 'zonesData', data: ... }.

Risco: A estrutura de actionsData (shapes, layers) deve ser idêntica em ambos os lados.

4. Notas de Implementação
Escala: O FloorViewer calcula a escala de visualização para caber no ecrã, mas usa a editorScale (vinda do zonas.html) para cálculos de área reais.

Dependências: Chart.js é usado para os espectros sísmicos na Secção 7.