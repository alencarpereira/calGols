// ---------- HELPERS ----------

// Calcula fatorial de n
function factorial(n) {
    if (n <= 1) return 1;
    let f = 1;
    for (let i = 2; i <= n; i++) f *= i;
    return f;
}

// Probabilidade Poisson P(k; λ) = λ^k * e^-λ / k!
function poissonP(lambda, k) {
    return Math.pow(lambda, k) * Math.exp(-lambda) / factorial(k);
}

// Formata número como porcentagem
function formatPct(x) {
    return (x * 100).toFixed(1) + "%";
}

// ---------- FUNÇÃO PRINCIPAL ----------

function compute() {
    // Lê as médias dos últimos 5 jogos
    const m_casa = parseFloat(document.getElementById("m_casa").value) || 0;
    const s_casa = parseFloat(document.getElementById("s_casa").value) || 0;
    const m_visit = parseFloat(document.getElementById("m_visit").value) || 0;
    const s_visit = parseFloat(document.getElementById("s_visit").value) || 0;

    if (!m_casa || !s_casa || !m_visit || !s_visit) {
        alert("Preencha todas as médias antes de gerar os resultados!");
        return;
    }

    // λ esperado de gols (Poisson simples)
    const lambda_home = (m_casa + s_visit) / 2;
    const lambda_away = (m_visit + s_casa) / 2;

    const maxK = 7; // 0..6, 7 = 7+
    const bins = maxK + 1;

    // Distribuições marginais
    const pHome = Array(bins).fill(0);
    const pAway = Array(bins).fill(0);
    for (let k = 0; k < maxK; k++) {
        pHome[k] = poissonP(lambda_home, k);
        pAway[k] = poissonP(lambda_away, k);
    }
    // Acumula a probabilidade restante no último bin
    pHome[maxK] = 1 - pHome.slice(0, maxK).reduce((a, b) => a + b, 0);
    pAway[maxK] = 1 - pAway.slice(0, maxK).reduce((a, b) => a + b, 0);

    // Matriz conjunta (placar casa x visitante)
    const joint = Array.from({ length: bins }, () => Array(bins).fill(0));
    for (let i = 0; i < bins; i++) {
        for (let j = 0; j < bins; j++) {
            joint[i][j] = pHome[i] * pAway[j];
        }
    }

    // Distribuição total de gols
    const pTotal = Array(2 * bins + 1).fill(0);
    for (let i = 0; i < bins; i++) {
        for (let j = 0; j < bins; j++) {
            const idx = Math.min(i + j, pTotal.length - 1);
            pTotal[idx] += joint[i][j];
        }
    }

    // ---------- PRINCIPAIS PROBABILIDADES ----------
    const prob_over_1_5 = 1 - ((pTotal[0] || 0) + (pTotal[1] || 0));
    const prob_under_3_5 =
        (pTotal[0] || 0) +
        (pTotal[1] || 0) +
        (pTotal[2] || 0) +
        (pTotal[3] || 0);

    const p_home0 = pHome[0] || 0;
    const p_away0 = pAway[0] || 0;
    const p_both_score = 1 - p_home0 - p_away0 + p_home0 * p_away0; // BTTS

    let p_home_win = 0,
        p_away_win = 0,
        p_draw = 0;
    for (let i = 0; i < bins; i++) {
        for (let j = 0; j < bins; j++) {
            if (i > j) p_home_win += joint[i][j];
            else if (i < j) p_away_win += joint[i][j];
            else p_draw += joint[i][j];
        }
    }

    // ---------- EXIBIÇÃO ----------

    // Resumo de λ e resultados
    document.getElementById("res-summary").innerHTML = `
    <b>λ Casa:</b> ${lambda_home.toFixed(2)} |
    <b>λ Visitante:</b> ${lambda_away.toFixed(2)}<br>
    <b>Vitória Casa:</b> ${formatPct(p_home_win)} |
    <b>Empate:</b> ${formatPct(p_draw)} |
    <b>Vitória Visitante:</b> ${formatPct(p_away_win)}
  `;

    // Lista principais probabilidades
    const mainProbs = [
        ["Over 1.5 gols", prob_over_1_5],
        ["Under 3.5 gols", prob_under_3_5],
        ["Ambos marcam (BTTS)", p_both_score],
    ];
    document.getElementById("main-probs").innerHTML = mainProbs
        .map(([name, val]) => `<li>${name}: <b>${formatPct(val)}</b></li>`)
        .join("");

    // Distribuição de gols
    document.getElementById("dist-home").innerHTML = pHome
        .map((p, i) => `<span>${i}${i === maxK ? "+" : ""}: ${formatPct(p)}</span>`)
        .join("");
    document.getElementById("dist-away").innerHTML = pAway
        .map((p, i) => `<span>${i}${i === maxK ? "+" : ""}: ${formatPct(p)}</span>`)
        .join("");

    // Matriz de gols
    let html = "<table><tr><th>Casa \\ Visit</th>";
    for (let j = 0; j < bins; j++) html += `<th>${j}${j === maxK ? "+" : ""}</th>`;
    html += "</tr>";
    for (let i = 0; i < bins; i++) {
        html += `<tr><th>${i}${i === maxK ? "+" : ""}</th>`;
        for (let j = 0; j < bins; j++) html += `<td>${formatPct(joint[i][j])}</td>`;
        html += "</tr>";
    }
    html += "</table>";
    document.getElementById("matrix").innerHTML = html;
}

// ---------- CONTROLES ----------

// Botão Gerar
document.getElementById("gerar").onclick = compute;

// Botão Limpar
document.getElementById("limpar").onclick = () => {
    ["m_casa", "s_casa", "m_visit", "s_visit"].forEach(
        (id) => (document.getElementById(id).value = "")
    );
    document.getElementById("res-summary").textContent =
        "Preencha as médias e clique em Gerar.";
    document.getElementById("main-probs").innerHTML = "";
    document.getElementById("dist-home").innerHTML = "";
    document.getElementById("dist-away").innerHTML = "";
    document.getElementById("matrix").innerHTML = "";
};

// Botão Exemplo Automático
document.getElementById("exemplo").onclick = () => {
    document.getElementById("m_casa").value = 1.6;
    document.getElementById("s_casa").value = 0.9;
    document.getElementById("m_visit").value = 1.2;
    document.getElementById("s_visit").value = 1.3;
    compute();
};

