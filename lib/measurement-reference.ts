import type { MeasurementFieldKey } from "@/types/measurement";

export type MeasurementReferenceTable = {
  columns: string[];
  rows: string[][];
};

export type MeasurementReference = {
  what: string;
  table?: MeasurementReferenceTable;
  notes: string[];
  source: string;
};

export type MeasurementDirection = "higherIsBetter" | "lowerIsBetter";

/** Which way counts as "improvement" for fields where that's reasonably
 * well established — used to color a before/after delta green or red.
 * Deliberately left out for fields where more/less isn't inherently
 * better: weight and water % depend on individual goals/hydration, height
 * doesn't change, and BMR just scales with body size — those only ever get
 * a plain (uncolored) delta, never a green/red judgment. */
export const MEASUREMENT_DIRECTION: Partial<Record<MeasurementFieldKey, MeasurementDirection>> = {
  bodyFatPct: "lowerIsBetter",
  muscleMassPct: "higherIsBetter",
  visceralFat: "lowerIsBetter",
  boneMassKg: "higherIsBetter",
};

/** Explanatory text + reference ranges for each bioimpedance field, shown in
 * `MeasurementInfoModal`. Only the fields actually derived from bioimpedance
 * are covered — weight/height are plain measurements, not BIA readings, so
 * they're intentionally left out.
 *
 * These are general population reference ranges from published literature
 * (cited per field below), not a personalized or medical assessment — this
 * app doesn't collect age/sex, so ranges are shown as a table to read
 * yourself against, same as a body composition scale's printed manual would
 * show. Consumer bioimpedance scales also read a few points off gold-standard
 * methods (DEXA), so treat these as context for tracking your own trend, not
 * a strict pass/fail line. */
export const MEASUREMENT_REFERENCE: Partial<Record<MeasurementFieldKey, MeasurementReference>> = {
  bodyFatPct: {
    what: "Porcentagem do seu peso total que é gordura (a essencial para o corpo funcionar, mais a de reserva). A bioimpedância estima isso pela resistência elétrica dos tecidos — músculo e água conduzem corrente melhor do que gordura.",
    table: {
      columns: ["Faixa etária", "Homens (saudável)", "Mulheres (saudável)"],
      rows: [
        ["20–39 anos", "8–19%", "21–32%"],
        ["40–59 anos", "11–21%", "23–33%"],
        ["60–79 anos", "13–24%", "24–35%"],
      ],
    },
    notes: [
      "Abaixo da faixa: percentual muito baixo, pode faltar gordura essencial para funções hormonais.",
      "Acima da faixa: percentual elevado, associado a mais risco metabólico e cardiovascular.",
    ],
    source: "Faixas de Gallagher et al. (2000, American Journal of Clinical Nutrition), adotadas pelo American College of Sports Medicine.",
  },
  muscleMassPct: {
    what: "Porcentagem do peso corporal ocupada por músculo esquelético. Sobe com treino de força consistente e tende a cair com sedentarismo e envelhecimento.",
    table: {
      columns: ["Sexo", "Média populacional"],
      rows: [
        ["Homens", "≈ 38%"],
        ["Mulheres", "≈ 31%"],
      ],
    },
    notes: [
      "Não existe uma faixa de \"certo/errado\" amplamente padronizada como a de gordura corporal — o valor acima é só a média da população, não um alvo.",
      "Quanto maior, geralmente mais indício de massa muscular desenvolvida — mas o que mais importa é a tendência do seu próprio número ao longo do tempo, não o valor isolado.",
      "Aparelhos de bioimpedância diferentes podem variar alguns pontos percentuais entre si — use sempre o mesmo aparelho para comparar sua evolução.",
    ],
    source: "Médias populacionais amplamente reportadas em literatura de composição corporal por bioimpedância.",
  },
  waterPct: {
    what: "Porcentagem do peso corporal que é água — presente no sangue, músculos, órgãos etc. Músculo retém bem mais água que gordura, então esse número costuma acompanhar a massa muscular.",
    table: {
      columns: ["Perfil", "Homens", "Mulheres"],
      rows: [
        ["Faixa normal (adultos)", "50–60%", "55–65%"],
        ["Muito musculoso(a)/magro(a)", "pode passar de 65–70%", "pode passar de 65–70%"],
        ["Com excesso de gordura corporal", "45–50%", "45–50%"],
      ],
    },
    notes: [
      "Idade também influencia: a faixa tende a cair um pouco depois dos 60 anos.",
      "Hidratação do dia, exercício recente e ciclo hormonal afetam a leitura na hora — compare medidas feitas em condições parecidas (ex.: sempre em jejum, de manhã).",
    ],
    source: "Faixas de referência padrão de bioimpedância (BIA) amplamente citadas na literatura de composição corporal.",
  },
  boneMassKg: {
    what: "Estimativa do peso total do mineral presente nos seus ossos, calculada a partir do seu peso, sexo e da resistência elétrica medida.",
    table: {
      columns: ["Sexo", "Peso corporal", "Massa óssea saudável (aprox.)"],
      rows: [
        ["Mulheres", "até 50 kg", "≈ 1,95 kg"],
        ["Mulheres", "50–75 kg", "≈ 2,40 kg"],
        ["Mulheres", "acima de 75 kg", "≈ 2,90 kg"],
        ["Homens", "até 65 kg", "≈ 2,65 kg"],
        ["Homens", "65–95 kg", "≈ 3,29 kg"],
        ["Homens", "acima de 95 kg", "≈ 3,69 kg"],
      ],
    },
    notes: [
      "Valores aproximados — a massa óssea real também depende de altura, idade e densidade óssea individual, que a bioimpedância caseira não mede com precisão.",
      "Esse número costuma ser bem estável; uma queda brusca de uma medida pra outra geralmente é variação da pesagem, não perda real de osso.",
    ],
    source: "Faixas de referência aproximadas por peso corporal, comuns em manuais de balanças de bioimpedância.",
  },
  visceralFat: {
    what: "Gordura armazenada ao redor dos órgãos internos (fígado, intestino etc.), diferente da gordura visível abaixo da pele. Mesmo com peso normal, um nível alto de gordura visceral aumenta o risco cardiometabólico.",
    table: {
      columns: ["Classificação", "Faixa (escala 1–59)"],
      rows: [
        ["Saudável", "1–12"],
        ["Elevada", "13–19"],
        ["Muito alta", "20 ou mais"],
      ],
    },
    notes: [
      "Essa escala (1–59) é a usada por balanças de bioimpedância no estilo Tanita/Omron. Outros aparelhos, como InBody, usam uma escala diferente (nível abaixo de 10 é considerado saudável) — confira qual escala o seu segue.",
      "Diferente da gordura corporal total, essa é a que mais se relaciona com risco de diabetes tipo 2 e doenças cardíacas.",
    ],
    source: "Classificação de gordura visceral da Tanita, também usada por outras balanças de bioimpedância domésticas.",
  },
  bmrKcal: {
    what: "Estimativa de quantas calorias seu corpo gasta em repouso completo só para manter funções vitais (respiração, batimentos etc.), antes de qualquer atividade do dia. Costuma representar 60–70% do seu gasto calórico total diário.",
    table: {
      columns: ["Perfil (~30 anos, peso médio)", "Faixa típica"],
      rows: [
        ["Homens", "≈ 1.700–1.900 kcal/dia"],
        ["Mulheres", "≈ 1.300–1.500 kcal/dia"],
      ],
    },
    notes: [
      "Varia muito de pessoa para pessoa — depende principalmente de peso, altura, idade e sexo. Não existe um único valor \"certo\".",
      "Regra prática: cerca de ±100 kcal a cada 5kg de diferença de peso, e ±50 kcal a cada década de idade.",
      "Mais massa muscular tende a elevar esse número, já que músculo consome mais energia em repouso do que gordura.",
    ],
    source: "Faixas típicas da equação de Mifflin-St Jeor (1990), a mais usada para estimar metabolismo basal.",
  },
};
