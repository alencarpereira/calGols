let grafico; // variável global do Chart.js

// ======== CRIA OS CAMPOS ========
function criarCampos(idPrefixo) {
    const container = document.getElementById(idPrefixo + "-jogos");
    for (let i = 1; i <= 5; i++) {
        container.innerHTML += `
      <input type="number" id="${idPrefixo}GolsFeitos${i}" placeholder="Fez J${i}" step="0.1">
      <input type="number" id="${idPrefixo}GolsSofridos${i}" placeholder="Tomou J${i}" step="0.1">
    `;
    }
}
criarCampos("casa");
criarCampos("fora");
criarCampos("confronto");

// ======== BOTÕES ========
document.getElementById("calcular").addEventListener("click", calcular);
document.getElementById("limpar").addEventListener("click", limpar);

// ======== FUNÇÃO PRINCIPAL ========
function calcular() {
    const casa = calcularMedia("casa");
    const fora = calcularMedia("fora");
    const confronto = calcularMedia("confronto");

    // Média geral de gols
    const mediaMarcados = (casa.marcados + fora.marcados) / 2;
    const mediaSofridos = (casa.sofridos + fora.sofridos) / 2;
    const mediaConfronto = (confronto.marcados + confronto.sofridos) / 2;

    // Média ponderada (peso extra para confronto direto)
    const mediaTotal = (mediaMarcados + mediaSofridos + mediaConfronto * 1.2) / 3;

    // Cálculo das probabilidades
    const over15 = Math.min(mediaTotal * 45, 95);
    const over25 = Math.min(mediaTotal * 35, 90);
    const under35 = Math.max(100 - mediaTotal * 25, 10);

    document.getElementById("resultado").innerHTML = `
    <h3>Probabilidades de Gols</h3>
    <p><strong>+1.5 gols:</strong> ${over15.toFixed(1)}%</p>
    <p><strong>+2.5 gols:</strong> ${over25.toFixed(1)}%</p>
    <p><strong>Under 3.5 gols:</strong> ${under35.toFixed(1)}%</p>
    <hr>
    <p><small>Média combinada: ${mediaTotal.toFixed(2)} gols por jogo</small></p>
  `;

    gerarGrafico(over15, over25, under35);
}

// ======== CÁLCULO DAS MÉDIAS ========
function calcularMedia(prefixo) {
    let feitos = 0, sofridos = 0;
    for (let i = 1; i <= 5; i++) {
        feitos += parseFloat(document.getElementById(prefixo + "GolsFeitos" + i).value) || 0;
        sofridos += parseFloat(document.getElementById(prefixo + "GolsSofridos" + i).value) || 0;
    }
    return {
        marcados: feitos / 5,
        sofridos: sofridos / 5
    };
}

// ======== GERA GRÁFICO ========
function gerarGrafico(over15, over25, under35) {
    const ctx = document.getElementById("graficoGols").getContext("2d");

    // Apaga gráfico anterior se existir
    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["+1.5 Gols", "+2.5 Gols", "Under 3.5 Gols"],
            datasets: [{
                label: "Probabilidade (%)",
                data: [over15, over25, under35],
                backgroundColor: ["#00e676", "#03a9f4", "#f44336"],
                borderRadius: 10
            }]
        },
        options: {
            indexAxis: "y",
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: "#333" },
                    ticks: { color: "#fff" }
                },
                y: {
                    grid: { color: "#333" },
                    ticks: { color: "#fff" }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.parsed.x.toFixed(1)}%`
                    }
                }
            }
        }
    });
}

// ======== LIMPAR CAMPOS ========
function limpar() {
    document.querySelectorAll("input").forEach(i => i.value = "");
    document.getElementById("resultado").innerHTML = "";
    if (grafico) grafico.destroy();
}


