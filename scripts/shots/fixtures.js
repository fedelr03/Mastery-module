/* Example account used only for the landing-page screenshots. */
const DAY = 86_400_000;
const ago = (d) => new Date(Date.now() - d * DAY).toISOString();
const inDays = (d) => new Date(Date.now() + d * DAY).toISOString();

const LANG = new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('lang') === 'en' ? 'en' : 'es';

export const USER = { id: 'demo-user', email: LANG === 'en' ? 'sofi@example.com' : 'sofi@ejemplo.com' };
export const PROFILE = { username: 'Sofi', level: 'intermediate', role: 'user' };

const kc = (...titles) => titles.map((title) => ({ title, description: '', formula: '' }));

const DERIVADAS_ES = {
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
const TOPICS_ES = [
  ['Derivadas', 'math', 0, 3, DERIVADAS_ES.keyConcepts, card(9, 2.5, 6)],
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


/* ── English version of the same account (?lang=en) ── */
const DERIVADAS_EN = {
  title: 'Derivatives',
  topicType: 'concept',
  explanationBlocks: [
    { type: 'analogy', label: 'Think of it this way', text: 'A striker starts sprinting toward goal. If you write down where he is every second, you know how far he moved on average. But the radar that clocks his speed **right as he shoots** tells you something else: how fast he was going at that exact instant. That is the derivative.' },
    { type: 'text', text: 'The derivative measures how a function changes when its variable changes a tiny bit. Geometrically it is the **slope of the tangent line** to the curve at a point: if it is positive the function goes up, if it is negative it goes down, and if it is zero you are at a peak or a valley.' },
    { type: 'keypoint', text: 'It is defined as the limit of the difference quotient as the step h gets smaller and smaller:\nf\'(x) = lim_{h→0} (f(x+h) − f(x))/(h)' },
    { type: 'steps', title: 'Worked Example: the striker\'s speed', context: 'The striker\'s position (in meters) after t seconds is p(t) = 3t^2 + 2t. How fast is he going at 4 seconds, when he shoots?', items: [
      'Step 1: Speed is the derivative of position: v(t) = p\'(t).',
      'Step 2: Differentiate term by term with the power rule: (d)/(dt)(3t^2) = 6t and (d)/(dt)(2t) = 2.',
      'Step 3: So v(t) = 6t + 2.',
      'Step 4: Plug in t = 4: v(4) = 6×4 + 2 = 26 m/s. That is the number the radar would show.',
    ] },
  ],
  keyConcepts: [
    { title: 'Instantaneous rate of change', description: 'How much f changes per unit of x at one specific point, not on average.', formula: 'f\'(a) = lim_{h→0} (f(a+h) − f(a))/(h)' },
    { title: 'Tangent line', description: 'The line that touches the curve at a point with the same tilt; its slope is the derivative.', formula: 'y − f(a) = f\'(a)×(x − a)' },
    { title: 'Power rule', description: 'The shortcut you will use all the time: bring the exponent down and subtract one.', formula: '(d)/(dx) x^n = n×x^{n−1}' },
  ],
  applications: [
    { title: 'Economics: marginal cost', description: 'If C(q) is the cost of producing q units, C\'(q) tells you what one more unit costs.', example: 'With C(q) = 500 + 4q + 0.02q^2, unit 101 costs about C\'(100) = 4 + 0.04×100 = $8.' },
    { title: 'Physics: speed and acceleration', description: 'The derivative of position is speed; the derivative of speed is acceleration.', example: 'In the striker example, a(t) = v\'(t) = 6 m/s²: he speeds up by the same amount the whole time.' },
  ],
  quiz: [
    { type: 'mc', question: 'What does the derivative of f at x = a represent geometrically?', options: ['The area under the curve up to a', 'The slope of the tangent line at a', 'The value of f at a', 'The distance from a to the origin'], correctIndex: 1, explanation: 'The derivative at a point is the slope of the tangent line to the curve at that point.' },
    { type: 'mc', question: 'If p(t) = 3t^2 + 2t, what is p\'(1)?', options: ['5', '6', '8', '11'], correctIndex: 2, explanation: 'p\'(t) = 6t + 2, so p\'(1) = 6 + 2 = 8.' },
    { type: 'tf', statement: 'If f\'(a) = 0, the function must have a maximum at a.', answer: false, explanation: 'It can be a maximum, a minimum or an inflection point, like f(x) = x^3 at x = 0.' },
  ],
  exam: [
    { type: 'mc', question: 'What is the derivative of f(x) = x^5?', options: ['x^4', '5x^4', '5x^5', '(x^6)/(6)'], correctIndex: 1, explanation: 'By the power rule, (d)/(dx) x^5 = 5x^4.' },
    { type: 'mc', question: 'If f\'(x) > 0 on an interval, then on that interval f:', options: ['Is constant', 'Decreases', 'Increases', 'Equals zero'], correctIndex: 2, explanation: 'A positive derivative means the function increases.' },
    { type: 'mc', question: 'The derivative of a constant is:', options: ['The same constant', '1', '0', 'It does not exist'], correctIndex: 2, explanation: 'A constant does not change, so its rate of change is 0.' },
    { type: 'mc', question: 'If C(q) = 200 + 3q, the marginal cost is:', options: ['3', '200', '203', '3q'], correctIndex: 0, explanation: 'C\'(q) = 3: each extra unit costs $3.' },
    { type: 'mc', question: 'What does f\'(2) = −4 tell you?', options: ['That f(2) = −4', 'That near x = 2, f drops 4 units per unit of x', 'That f crosses the axis at −4', 'That f is not continuous at 2'], correctIndex: 1, explanation: 'A negative derivative means f goes down, at 4 per unit, near x = 2.' },
  ],
  tips: [
    { title: 'Idea first, rules second', content: 'Before memorizing rules, make sure you can explain what f\'(a) means with an example of your own.' },
    { title: 'Check with a graph', content: 'If the derivative comes out positive, the curve has to be going up there. If not, check your work.' },
  ],
  youtubeSearches: [],
  relatedTopics: [
    { label: 'Chain rule', tagline: 'Differentiating functions inside functions' },
    { label: 'Maxima and minima', tagline: 'Optimizing with the derivative' },
    { label: 'Integrals', tagline: 'The way back' },
    { label: 'Limits', tagline: 'Where it all starts' },
  ],
};

const TOPICS_EN = [
  ['Derivatives', 'math', 0, 3, DERIVADAS_EN.keyConcepts, card(9, 2.5, 6)],
  ['Price elasticity', 'econ', 1, 2, kc('Percentage rate of change', 'Elastic demand'), card(8, 2.4, 4)],
  ['Linear algebra', 'math', 2, 1, kc('Matrix linear system', 'Determinant'), card(2, 2.2, -1)],
  ["Bayes' theorem", 'stats', 3, 2, kc('Conditional probability', 'Prior and posterior'), card(30, 2.6, 18)],
  ['Inflation', 'econ', 3, 1, kc('Nominal and real rate', 'Real value of money', 'Price index'), card(3, 2.3, -4)],
  ['Compound interest', 'finance', 4, 2, kc('Annual nominal rate', 'Real value of money', 'Compounding'), card(25, 2.5, 12)],
  ['Linear regression', 'stats', 5, 1, kc('Matrix least squares', 'Linear fit'), card(10, 2.4, 5)],
  ['Integration by parts', 'math', 5, 1, kc('Product rule', 'Choosing u and dv'), card(3, 2.5, 2)],
  ['Supply and demand', 'econ', 6, 2, kc('Equilibrium price', 'Consumer surplus'), card(28, 2.6, 15)],
  ['DCF valuation', 'finance', 7, 1, kc('Discounted cash flow', 'Perpetual growth rate'), card(2, 2.5, 1)],
  ['Confidence intervals', 'stats', 8, 1, kc('Confidence level', 'Standard error'), card(1, 2.1, -2)],
  ['GDP and growth', 'econ', 9, 1, kc('Gross domestic product', 'Real growth rate'), card(4, 2.5, 3)],
  ['Derivatives of composite functions', 'math', 10, 1, kc('Chain rule', 'Inner function'), card(1, 2.0, -3)],
  ['Pythagorean theorem', 'math', 12, 1, kc('Right triangle', 'Hypotenuse'), null],
  ['Financial ratios', 'finance', 14, 1, kc('Current ratio', 'Return on assets'), null],
];

export const DERIVADAS = LANG === 'en' ? DERIVADAS_EN : DERIVADAS_ES;
const TOPICS = LANG === 'en' ? TOPICS_EN : TOPICS_ES;

export const HISTORY = [];
export const CARDS = [];
TOPICS.forEach(([topic, module, d, times, keyConcepts, c], i) => {
  for (let k = 0; k < times; k++) {
    HISTORY.push({
      id: `h${i}-${k}`, user_id: USER.id, topic, module, mode: 'fast', lang: LANG,
      created_at: ago(d + k * 2 + i * 0.01),
      content: topic === DERIVADAS.title ? DERIVADAS : { title: topic, keyConcepts, explanationBlocks: [] },
    });
  }
  if (c) CARDS.push({ id: `c${i}`, user_id: USER.id, topic, module, lang: LANG, level: 'intermediate', ...c });
});
HISTORY.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

/* Canned answer for the review screen's question. */
const REVIEW_QA_ES = {
  question: 'Dá un ejemplo concreto de la diferencia entre la tasa nominal y la tasa real.',
  modelAnswer: 'Si un plazo fijo paga 30% anual y la inflación del año es 25%, ganás 30% nominal, pero tu poder de compra sube solo 4%: (1,30)/(1,25) − 1 ≈ 0,04.',
  userAnswer: 'Si el banco me paga 30% y los precios suben 25%, en realidad gano bastante menos que 30%, como un 5%.',
};

const REVIEW_QA_EN = {
  question: 'Give a concrete example of the difference between the nominal rate and the real rate.',
  modelAnswer: 'If a savings account pays 30% a year and inflation that year is 25%, you earn 30% nominal, but your buying power only goes up about 4%: (1.30)/(1.25) − 1 ≈ 0.04.',
  userAnswer: 'If the bank pays me 30% and prices go up 25%, I actually earn a lot less than 30%, something like 5%.',
};

export const REVIEW_QA = LANG === 'en' ? REVIEW_QA_EN : REVIEW_QA_ES;
