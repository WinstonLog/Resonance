window.S = window.S || {};

S.Solver = {
  // Решает Lights Out для текущего состояния поля.
  // Возвращает массив индексов ячеек (r*cols + c), которые нужно нажать,
  // либо null, если решения нет.
  solve(cells, rows, cols){
    const n = rows * cols;
    const m = [];
    for(let i=0;i<n;i++) m.push(new Array(n+1).fill(0));

    // A[i][j] = 1, если press(j) тогглит i.
    // Отношение соседства симметрично, поэтому строим одним проходом.
    const dirs = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const i = r*cols + c;
      for(const [dr,dc] of dirs){
        const nr = r+dr, nc = c+dc;
        if(nr<0 || nr>=rows || nc<0 || nc>=cols) continue;
        const j = nr*cols + nc;
        m[i][j] ^= 1;
      }
      // b[i] — текущее состояние ячейки
      m[i][n] = cells[i].on ? 1 : 0;
    }

    // Прямой ход Гаусса над GF(2)
    let row = 0;
    const pivotCols = [];
    for(let col=0; col<n && row<n; col++){
      let pivot = -1;
      for(let r=row; r<n; r++){
        if(m[r][col] === 1){ pivot = r; break; }
      }
      if(pivot === -1) continue;

      const tmp = m[row]; m[row] = m[pivot]; m[pivot] = tmp;

      for(let r=0; r<n; r++){
        if(r !== row && m[r][col] === 1){
          for(let k=col; k<=n; k++) m[r][k] ^= m[row][k];
        }
      }
      pivotCols.push(col);
      row++;
    }

    // Проверка на несовместимость
    for(let r=row; r<n; r++){
      let allZero = true;
      for(let k=0; k<n; k++){ if(m[r][k]){ allZero = false; break; } }
      if(allZero && m[r][n] === 1) return null;
    }

    // Базовое решение: свободные переменные = 0
    const baseX = new Array(n).fill(0);
    for(let i=0; i<pivotCols.length; i++){
      baseX[pivotCols[i]] = m[i][n];
    }

    // Свободные столбцы и базис ядра
    const isPivot = new Array(n).fill(false);
    for(const col of pivotCols) isPivot[col] = true;
    const freeCols = [];
    for(let i=0;i<n;i++) if(!isPivot[i]) freeCols.push(i);

    const kernel = [];
    for(const fc of freeCols){
      const v = new Array(n).fill(0);
      v[fc] = 1;
      for(let i=0; i<pivotCols.length; i++){
        if(m[i][fc] === 1) v[pivotCols[i]] = 1;
      }
      kernel.push(v);
    }

    // Перебираем комбинации ядра — выбираем решение с минимальным числом ходов
    let best = baseX;
    let bestWeight = baseX.reduce((a,b) => a+b, 0);
    const k = kernel.length;
    // Защита от экспоненциального перебора
    const maxMask = (k <= 12) ? (1 << k) : (1 << 12);
    for(let mask=1; mask<maxMask; mask++){
      const cand = baseX.slice();
      for(let i=0; i<k && i<12; i++){
        if(mask & (1 << i)){
          for(let j=0; j<n; j++) cand[j] ^= kernel[i][j];
        }
      }
      const w = cand.reduce((a,b) => a+b, 0);
      if(w < bestWeight){ bestWeight = w; best = cand; }
    }

    // Возвращаем список индексов
    const out = [];
    for(let i=0; i<n; i++) if(best[i]) out.push(i);
    return out;
  }
};