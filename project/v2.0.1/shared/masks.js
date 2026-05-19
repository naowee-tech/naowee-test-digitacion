/* ═══════════════════════════════════════════════════════════════════
   masks.js — Máscaras de input para campos numéricos.
   Formatea con separador de miles (locale es-CO: punto como separador).

   API:
     maskMoney(input)        → "1.500.000" mientras se escribe
     maskInteger(input)      → "1.500" (sin decimales)
     maskDecimal(input, n=2) → "1.500,75"
     unmask(value)           → 1500000 (number) | NaN si vacío
     formatMoneda(n)         → "$ 1.500.000" estático
     bindMasksIn(scope)      → wira todos los inputs con
                               data-mask="money|integer|decimal"

   Uso típico:
     <input class="naowee-textfield__input" data-mask="money" name="presupuesto"/>
     bindMasksIn(form);
     // Al enviar: FormData.get('presupuesto') será "1.500.000".
     // Usa unmask() para obtener el número real.
   ═══════════════════════════════════════════════════════════════════ */

const LOCALE = 'es-CO'; // 1.500.000

/* Limpia todo lo que no sea dígito (preserva el cursor relativamente) */
function digitsOnly(s) {
  return String(s ?? '').replace(/\D/g, '');
}

/* Formato con separador de miles (sin decimales) */
export function formatMiles(n) {
  if (n === null || n === undefined || n === '') return '';
  const num = typeof n === 'number' ? n : parseInt(digitsOnly(n));
  if (isNaN(num)) return '';
  return num.toLocaleString(LOCALE);
}

/* Formato dinero estático con prefijo $ */
export function formatMoneda(n) {
  if (n === null || n === undefined || n === '') return '$ 0';
  const num = typeof n === 'number' ? n : parseInt(digitsOnly(n));
  if (isNaN(num)) return '$ 0';
  return '$ ' + num.toLocaleString(LOCALE);
}

/* Devuelve el número crudo a partir del input enmascarado */
export function unmask(value) {
  const d = digitsOnly(value);
  return d === '' ? NaN : parseInt(d);
}

/* Aplica máscara de miles (entero) a un input. Re-formatea on input. */
export function maskMoney(input) {
  if (!input || input.__hasMask) return;
  input.__hasMask = true;
  input.setAttribute('inputmode', 'numeric');
  input.setAttribute('autocomplete', 'off');

  const apply = () => {
    const caret = input.selectionStart;
    const before = input.value;
    const digitsBefore = digitsOnly(before.slice(0, caret));
    const formatted = formatMiles(digitsOnly(before));
    if (formatted === before) return;
    input.value = formatted;
    /* Reubicar cursor preservando posición relativa entre dígitos. */
    let count = 0, target = formatted.length;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        count++;
        if (count === digitsBefore.length) { target = i + 1; break; }
      }
    }
    try { input.setSelectionRange(target, target); } catch {}
  };

  input.addEventListener('input', apply);
  input.addEventListener('blur', apply);
  /* Formatear valor inicial si viene con número crudo */
  if (input.value) apply();
}

/* Máscara integer simple (alias de maskMoney sin decimales) */
export const maskInteger = maskMoney;

/* Máscara decimal — admite coma como separador decimal (locale es-CO) */
export function maskDecimal(input, decimals = 2) {
  if (!input || input.__hasMask) return;
  input.__hasMask = true;
  input.setAttribute('inputmode', 'decimal');
  input.setAttribute('autocomplete', 'off');

  const apply = () => {
    const raw = String(input.value || '').replace(/[^\d,]/g, '');
    if (!raw) return;
    const [intPart, decPart = ''] = raw.split(',');
    const intFormatted = intPart ? parseInt(intPart).toLocaleString(LOCALE) : '0';
    const decTrunc = decPart.slice(0, decimals);
    input.value = decPart !== '' || raw.endsWith(',')
      ? `${intFormatted},${decTrunc}`
      : intFormatted;
  };

  input.addEventListener('input', apply);
  input.addEventListener('blur', apply);
  if (input.value) apply();
}

/* Wira todos los inputs marcados con data-mask en un scope.
   Soporta:
     data-mask="money"   → enteros con separador de miles
     data-mask="integer" → idem
     data-mask="decimal" → con coma decimal (data-mask-decimals="2") */
export function bindMasksIn(scope) {
  if (!scope) return;
  scope.querySelectorAll('input[data-mask="money"], input[data-mask="integer"]').forEach(maskMoney);
  scope.querySelectorAll('input[data-mask="decimal"]').forEach(inp => {
    const dec = parseInt(inp.dataset.maskDecimals) || 2;
    maskDecimal(inp, dec);
  });
}

/* Helper: extrae el valor numérico de un input enmascarado */
export function getMaskedValue(input) {
  return unmask(input?.value);
}
