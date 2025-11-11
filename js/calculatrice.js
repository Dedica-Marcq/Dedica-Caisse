document.addEventListener('DOMContentLoaded', () => {
  const resultat = document.querySelector('.resultat');
  const keypad = document.querySelector('.calculatrice');
  let current = '';
  let operator = '';
  let previous = '';
  let resetNext = false;
  let expression = '';

  function updateDisplay(val) {
    resultat.textContent = val + ' €';
  }

  keypad.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    const value = e.target.textContent;

    if (!isNaN(value) || value === '00') {
      if (resetNext) {
        current = '';
        expression = '';
        resetNext = false;
      }
      current += value === '00' ? '00' : value;
      expression += value;
      updateDisplay(expression);
    } else if (value === ',') {
      if (!current.includes(',')) {
        current += current ? ',' : '0,';
        expression += value;
        updateDisplay(expression);
      }
    } else if (['+', '—', '×', '÷', '%'].includes(value)) {
      if (current || (value === '-' && expression === '')) {
        if (operator && current) {
          // Si on enchaîne les opérations, calcule le résultat précédent
          let a = parseFloat(previous);
          let b = parseFloat(current.replace(',', '.'));
          let res = 0;
          switch (operator) {
            case '+': res = a + b; break;
            case '—': res = a - b; break;
            case '×': res = a * b; break;
            case '÷': res = b !== 0 ? a / b : 0; break;
            case '%': res = a * b / 100; break;
          }
          previous = res.toString();
          current = '';
          expression = previous + value;
        } else {
          previous = current.replace(',', '.');
          current = '';
          expression += value;
        }
        operator = value;
        updateDisplay(expression);
      }
    } else if (value === '=') {
      if (previous && current && operator) {
        let a = parseFloat(previous);
        let b = parseFloat(current.replace(',', '.'));
        let res = 0;
        switch (operator) {
          case '+': res = a + b; break;
          case '—': res = a - b; break;
          case '×': res = a * b; break;
          case '÷': res = b !== 0 ? a / b : 0; break;
          case '%': res = a * b / 100; break;
        }
        expression += '=' + res.toFixed(2);
        updateDisplay(expression);
        current = res.toString();
        previous = '';
        operator = '';
        resetNext = true;
      }
    } else if (value === 'AC') {
      current = '';
      previous = '';
      operator = '';
      expression = '';
      updateDisplay('0.00');
    } else if (value === '(—)') {
      if (current) {
        if (current.startsWith('-')) {
          current = current.slice(1);
          expression = expression.replace(/-?[\d,]+$/, current);
        } else {
          current = '-' + current;
          expression = expression.replace(/[\d,]+$/, current);
        }
        updateDisplay(expression);
      }
    }
  });

  // Initial display
  updateDisplay('0.00');
});