/* Example account used only for the landing-page screenshots. */
const DAY = 86_400_000;
const ago = (d) => new Date(Date.now() - d * DAY).toISOString();
const inDays = (d) => new Date(Date.now() + d * DAY).toISOString();

export const USER = { id: 'demo-user', email: 'sofi@ejemplo.com' };
export const PROFILE = { username: 'Sofi', level: 'intermediate', role: 'user' };

const kc = (...titles) => titles.map((title) => ({ title, description: '', formula: '' }));

export const DERIVADAS = {
  title: 'Derivadas',
  topicType: 'concept',
  explanationBlocks: [
    { type: 'analogy', label: 'Pensalo así', text: 'Un delantero arranca a correr hacia el arco. Si medís dónde está cada segundo, sabés cuánto avanzó en promedio. Pero el radar que marca su velocidad **justo cuando patea** te da otra cosa: qué tan rápido iba en ese instante exacto. Eso es la derivada.' },
    { type: 'text', text: 'La derivada mide cómo cambia una función cuando su variable cambia un poquito. Geométricamente es la **pendiente de la recta tangente** a la curva en un punto: si es positiva la función sube, si es negativa baja, y si es cero estás en un pico o en un valle.' },
    { type: 'keypoint', text: 'Se define como el límite del cociente incremental, cuando el paso h se hace cada vez más chico:\nf\'(x) = lim_{h→0} (f(x+h) − f(x))/(h)' },
    { type: 'steps', title: 'Ejemplo Resuelto: la velocidad del delantero', context: 'La posición del delantero (en metros) a los t segundos es p(t) = 3t^2 + 2t. ¿A qué velocidad va a los 4 segundos, cuando patea?', items: [
      'Paso 1: La velocidad es la derivada de la posición: v(t) = p\'(t).',
      'Paso 2: Derivamos término a término con la regla de la potencia: (d)/(dt)(3t^2) = 6t y (d)/(dt)(2t) = 2.',
      'Paso 3: Entonces v(t) = 6t + 2.',
      'Paso 4: Reemplazamos t = 4: v(4) = 6×4 + 2 = 26 m/s. Ese es el número que marcaría el radar.',
    ] },
  ],
  keyConcepts: [
    { title: 'Tasa de cambio instantánea', description: 'Cuánto cambia f por cada unidad de x, en un punto puntual y no en promedio.', formula: 'f\'(a) = lim_{h→0} (f(a+h) − f(a))/(h)' },
    { title: 'Recta tangente', description: 'La recta que toca la curva en un punto con la misma inclinación; su pendiente es la derivada.', formula: 'y − f(a) = f\'(a)×(x − a)' },
    { title: 'Regla de la potencia', description: 'El atajo que vas a usar todo el tiempo: bajás el exponente y le restás uno.', formula: '(d)/(dx) x^n = n×x^{n−1}' },
  ],
  applications: [
    { title: 'Economía: costo marginal', description: 'Si C(q) es el costo de producir q unidades, C\'(q) dice cuánto cuesta producir una más.', example: 'Con C(q) = 500 + 4q + 0,02q^2, producir la unidad 101 cuesta aprox. C\'(100) = 4 + 0,04×100 = $8.' },
    { title: 'Física: velocidad y aceleración', description: 'La derivada de la posición es la velocidad; la derivada de la velocidad, la aceleración.', example: 'En el ejemplo del delantero, a(t) = v\'(t) = 6 m/s²: acelera lo mismo todo el tiempo.' },
  ],
  quiz: [
    { type: 'mc', question: '¿Qué representa geométricamente la derivada de f en x = a?', options: ['El área bajo la curva hasta a', 'La pendiente de la recta tangente en a', 'El valor de f en a', 'La distancia de a al origen'], correctIndex: 1, explanation: 'La derivada en un punto es la pendiente de la recta tangente a la curva en ese punto.' },
    { type: 'mc', question: 'Si p(t) = 3t^2 + 2t, ¿cuánto vale p\'(1)?', options: ['5', '6', '8', '11'], correctIndex: 2, explanation: 'p\'(t) = 6t + 2, así que p\'(1) = 6 + 2 = 8.' },
    { type: 'tf', statement: 'Si f\'(a) = 0, la función tiene sí o sí un máximo en a.', answer: false, explanation: 'Puede ser un máximo, un mínimo o un punto de inflexión como en f(x) = x^3 en x = 0.' },
  ],
  exam: [
    { type: 'mc', question: '¿Cuál es la derivada de f(x) = x^5?', options: ['x^4', '5x^4', '5x^5', '(x^6)/(6)'], correctIndex: 1, explanation: 'Por la regla de la potencia, (d)/(dx) x^5 = 5x^4.' },
    { type: 'mc', question: 'Si f\'(x) > 0 en un intervalo, entonces f en ese intervalo:', options: ['Es constante', 'Decrece', 'Crece', 'Vale cero'], correctIndex: 2, explanation: 'Una derivada positiva indica que la función crece.' },
    { type: 'mc', question: 'La derivada de una constante es:', options: ['La misma constante', '1', '0', 'No existe'], correctIndex: 2, explanation: 'Una constante no cambia, así que su tasa de cambio es 0.' },
    { type: 'mc', question: 'Si C(q) = 200 + 3q, el costo marginal es:', options: ['3', '200', '203', '3q'], correctIndex: 0, explanation: 'C\'(q) = 3: cada unidad extra cuesta $3.' },
    { type: 'mc', question: '¿Qué mide f\'(2) = −4?', options: ['Que f(2) = −4', 'Que cerca de x = 2, f baja 4 unidades por cada unidad de x', 'Que f corta el eje en −4', 'Que f no es continua en 2'], correctIndex: 1, explanation: 'La derivada negativa indica que f baja, a razón de 4 por unidad, cerca de x = 2.' },
  ],
  tips: [
    { title: 'Primero la idea, después las reglas', content: 'Antes de memorizar reglas, asegurate de poder explicar qué significa f\'(a) con un ejemplo tuyo.' },
    { title: 'Chequeá con un gráfico', content: 'Si la derivada te da positiva, la curva tiene que estar subiendo ahí. Si no, revisá la cuenta.' },
  ],
  youtubeSearches: [],
  relatedTopics: [
    { label: 'Regla de la cadena', tagline: 'Derivar funciones adentro de funciones' },
    { label: 'Máximos y mínimos', tagline: 'Optimizar con la derivada' },
    { label: 'Integrales', tagline: 'El camino de vuelta' },
    { label: 'Límites', tagline: 'La base de todo' },
  ],
};

/* Topics: [topic, subject, days ago, times studied, key concepts, card or null] */
const card = (interval, ease, dueInDays) => ({ interval, ease_factor: ease, repetitions: 3, status: 'review', next_review_at: inDays(dueInDays) });
const TOPICS = [
  ['Derivadas', 'math', 0, 3, DERIVADAS.keyConcepts, card(9, 2.5, 6)],
  ['Elasticidad precio', 'econ', 1, 2, kc('Tasa de cambio porcentual', 'Demanda elástica'), card(8, 2.4, 4)],
  ['Álgebra lineal', 'math', 2, 1, kc('Sistema lineal matricial', 'Determinante'), card(2, 2.2, -1)],
  ['Teorema de Bayes', 'stats', 3, 2, kc('Probabilidad condicional', 'Prior y posterior'), card(30, 2.6, 18)],
  ['Inflación', 'econ', 3, 1, kc('Tasa nominal y real', 'Valor real del dinero', 'Índice de precios'), card(3, 2.3, -4)],
  ['Interés compuesto', 'finance', 4, 2, kc('Tasa nominal anual', 'Valor real del dinero', 'Capitalización'), card(25, 2.5, 12)],
  ['Regresión lineal', 'stats', 5, 1, kc('Mínimos cuadrados matricial', 'Ajuste lineal'), card(10, 2.4, 5)],
  ['Integración por partes', 'math', 5, 1, kc('Regla del producto', 'Elección de u y dv'), card(3, 2.5, 2)],
  ['Oferta y demanda', 'econ', 6, 2, kc('Precio de equilibrio', 'Excedente del consumidor'), card(28, 2.6, 15)],
  ['Valuación por DCF', 'finance', 7, 1, kc('Flujo de fondos descontado', 'Tasa de crecimiento perpetuo'), card(2, 2.5, 1)],
  ['Intervalos de confianza', 'stats', 8, 1, kc('Nivel de confianza', 'Error estándar'), card(1, 2.1, -2)],
  ['PIB y crecimiento', 'econ', 9, 1, kc('Producto bruto interno', 'Tasa de crecimiento real'), card(4, 2.5, 3)],
  ['Derivadas de funciones compuestas', 'math', 10, 1, kc('Regla de la cadena', 'Función interna'), card(1, 2.0, -3)],
  ['Teorema de Pitágoras', 'math', 12, 1, kc('Triángulo rectángulo', 'Hipotenusa'), null],
  ['Ratios financieros', 'finance', 14, 1, kc('Liquidez corriente', 'Rentabilidad sobre activos'), null],
];

export const HISTORY = [];
export const CARDS = [];
TOPICS.forEach(([topic, module, d, times, keyConcepts, c], i) => {
  for (let k = 0; k < times; k++) {
    HISTORY.push({
      id: `h${i}-${k}`, user_id: USER.id, topic, module, mode: 'fast', lang: 'es',
      created_at: ago(d + k * 2 + i * 0.01),
      content: topic === 'Derivadas' ? DERIVADAS : { title: topic, keyConcepts, explanationBlocks: [] },
    });
  }
  if (c) CARDS.push({ id: `c${i}`, user_id: USER.id, topic, module, lang: 'es', level: 'intermediate', ...c });
});
HISTORY.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

/* Canned answer for the review screen's question. */
export const REVIEW_QA = {
  question: 'Dá un ejemplo concreto de la diferencia entre la tasa nominal y la tasa real.',
  modelAnswer: 'Si un plazo fijo paga 30% anual y la inflación del año es 25%, ganás 30% nominal, pero tu poder de compra sube solo 4%: (1,30)/(1,25) − 1 ≈ 0,04.',
  userAnswer: 'Si el banco me paga 30% y los precios suben 25%, en realidad gano bastante menos que 30%, como un 5%.',
};
