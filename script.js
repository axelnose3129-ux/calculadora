const currentDisplay = document.querySelector('#current');
const previousDisplay = document.querySelector('#previous');
const keys = document.querySelector('.keys');
const angleModeButton = document.querySelector('#angle-mode');

let expression = '';
let answer = '0';
let degrees = true;
let justCalculated = false;

function render() {
  currentDisplay.textContent = (justCalculated || answer === 'Error' ? answer : (expression || answer)).replace(/\./g, ',');
  previousDisplay.textContent = expression && justCalculated ? expression.replace(/\./g, ',') + ' =' : '';
  angleModeButton.textContent = degrees ? 'DEG' : 'RAD';
}

function append(value) {
  if (justCalculated) {
    const continuesResult = /^[+\u2212\u00d7\u00f7^!%]/.test(value);
    expression = continuesResult ? answer + value : '';
  }
  justCalculated = false;
  expression += value === ',' ? '.' : value;
  render();
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error('Factorial');
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function evaluate(source) {
  let js = source
    .replace(/\u03c0/g, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/\u00d7/g, '*').replace(/\u00f7/g, '/').replace(/\u2212/g, '-')
    .replace(/\u221a\(/g, 'sqrt(')
    .replace(/\^/g, '**')
    .replace(/(\d+(?:\.\d+)?|\([^()]*\))!/g, 'factorial($1)')
    .replace(/%/g, '/100')
    .replace(/\b(sin|cos|tan)\(/g, 'trig$1(')
    .replace(/\bsqrt\(/g, 'Math.sqrt(')
    .replace(/\blog\(/g, 'Math.log10(')
    .replace(/\bln\(/g, 'Math.log(');
  js = js.replace(/(\d|\)|Math\.PI|Math\.E)(?=(?:Math\.|factorial\(|trig(?:sin|cos|tan)\())/g, '$1*');
  if (/[^\d\s.+*/(),-]|(?:^|[^\w])(?:window|document|globalThis|constructor|prototype|eval|Function)\b/.test(js.replace(/Math\.(?:PI|E|sqrt|log10|log)|factorial|trig(?:sin|cos|tan)/g, ''))) throw new Error('Invalid');
  const trig = fn => x => Math[fn](degrees ? x * Math.PI / 180 : x);
  const result = Function('factorial', 'trigsin', 'trigcos', 'trigtan', `"use strict"; return (${js});`)(factorial, trig('sin'), trig('cos'), trig('tan'));
  if (!Number.isFinite(result)) throw new Error('Invalid result');
  return Number.parseFloat(result.toPrecision(12));
}

function calculate() {
  if (!expression.trim()) return;
  try { answer = String(evaluate(expression)); justCalculated = true; }
  catch { answer = 'Error'; justCalculated = false; }
  render();
}

function clear() { expression = ''; answer = '0'; justCalculated = false; render(); }

function deleteLast() {
  if (justCalculated || answer === 'Error') { expression = ''; answer = '0'; justCalculated = false; }
  else expression = expression.slice(0, -1);
  render();
}

function toggleSign() {
  if (justCalculated && answer !== 'Error') expression = answer;
  if (!expression) expression = '\u2212';
  else if (/[\d)\u03c0e]$/.test(expression)) expression = `\u2212(${expression})`;
  else if (expression.endsWith('\u2212')) expression = expression.slice(0, -1);
  else expression += '\u2212';
  justCalculated = false;
  render();
}

keys.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.value !== undefined) append(button.dataset.value);
  else if (button.dataset.action === 'clear') clear();
  else if (button.dataset.action === 'delete') deleteLast();
  else if (button.dataset.action === 'sign') toggleSign();
  else if (button.dataset.action === 'equals') calculate();
});

angleModeButton.addEventListener('click', () => { degrees = !degrees; render(); });

document.addEventListener('keydown', event => {
  if (/^[0-9]$/.test(event.key)) append(event.key);
  else if (event.key === '.' || event.key === ',') append(',');
  else if (['+', '-', '*', '/', '(', ')', '%', '^', '!'].includes(event.key)) {
    event.preventDefault();
    append(({ '*': '\u00d7', '/': '\u00f7', '-': '\u2212' })[event.key] || event.key);
  } else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); calculate(); }
  else if (event.key === 'Backspace') deleteLast();
  else if (event.key === 'Escape' || event.key === 'Delete') clear();
});

render();
