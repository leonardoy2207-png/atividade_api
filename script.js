// API de Breaking Bad. A API não libera CORS para o navegador, então a chamada passa por um proxy.
const API = 'https://proxy.cors.dev/https://api.mridul.tech/api/breaking-bad';

let todasAsFrases = []; // todas as frases, carregadas ao abrir a página

// Faz a chamada à API e devolve só a lista de dados
async function consultar(caminho) {
  const resposta = await fetch(API + caminho);
  if (!resposta.ok) {
    throw new Error('A API respondeu com o status ' + resposta.status);
  }
  const resultado = await resposta.json();
  return resultado.data;
}

// Mostra uma mensagem na tela (carregando, erro, etc.)
function avisar(texto, tipo = 'info') {
  document.getElementById('resultados').innerHTML =
    `<div class="col-12"><div class="alert alert-${tipo} mb-0">${texto}</div></div>`;
}

// Embaralha uma lista (usado na exibição sem repetição)
function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// ---------- FRASES ----------

function desenharFrase(frase) {
  return `<div class="col-12 col-lg-6">
    <article class="result-card h-100 p-3 bg-white">
      <p class="frase mb-2">“${frase.quote}”</p>
      <span class="badge text-bg-success">${frase.author}</span>
    </article>
  </div>`;
}

function mostrarFrases(frases) {
  if (frases.length === 0) {
    avisar('Nenhuma frase encontrada.', 'warning');
    return;
  }
  document.getElementById('resultados').innerHTML = frases.map(desenharFrase).join('');
}

// Sem personagem escolhido: usa todas as frases.
// Com personagem escolhido: chama a API com o filtro ?author=
async function pegarFrases() {
  const autor = document.getElementById('autor').value;
  if (autor === '') {
    return todasAsFrases;
  }
  return await consultar('/quotes?author=' + encodeURIComponent(autor));
}

async function sortearFrase() {
  avisar('Sorteando frase...');
  try {
    const frases = await pegarFrases();
    const sorteada = frases[Math.floor(Math.random() * frases.length)];
    mostrarFrases(frases.length ? [sorteada] : []);
  } catch (erro) {
    avisar('Não foi possível carregar as frases. ' + erro.message, 'danger');
  }
}

async function listarVarias() {
  const quantidade = Number(document.getElementById('quantidade').value);
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 50) {
    avisar('Informe uma quantidade entre 1 e 50.', 'warning');
    return;
  }

  avisar('Carregando frases...');
  try {
    const frases = await pegarFrases();
    const comRepeticao = document.getElementById('repeticao').value === 'com';
    let escolhidas = [];

    if (comRepeticao) {
      // Com repetição: sorteia várias vezes, a mesma frase pode aparecer de novo
      for (let i = 0; i < quantidade; i++) {
        escolhidas.push(frases[Math.floor(Math.random() * frases.length)]);
      }
    } else {
      // Sem repetição: embaralha e pega as primeiras
      escolhidas = embaralhar(frases).slice(0, quantidade);
    }

    mostrarFrases(frases.length ? escolhidas : []);
  } catch (erro) {
    avisar('Não foi possível carregar as frases. ' + erro.message, 'danger');
  }
}

// Ao abrir a página: busca todas as frases e preenche o select de personagens
async function carregarFrases() {
  avisar('Carregando frases...');
  try {
    todasAsFrases = await consultar('/quotes');
    const autores = [...new Set(todasAsFrases.map(f => f.author))].sort();
    document.getElementById('autor').innerHTML =
      '<option value="">Todos os personagens</option>' +
      autores.map(a => `<option value="${a}">${a}</option>`).join('');
    sortearFrase();
  } catch (erro) {
    document.getElementById('autor').innerHTML = '<option value="">Erro ao carregar</option>';
    avisar('Não foi possível carregar as frases. ' + erro.message, 'danger');
  }
}

// ---------- PERSONAGENS ----------

function desenharPersonagem(p) {
  const ocupacoes = p.occupation || [];
  const temporadas = p.appearances || [];
  return `<div class="col-12 col-md-6 col-xl-4">
    <article class="detail-card h-100 bg-white">
      ${p.image_url ? `<img class="character-image" src="${p.image_url}" alt="${p.name}" loading="lazy">` : ''}
      <div class="p-3">
        <h2 class="h5 mb-1">${p.name}</h2>
        <p class="text-secondary mb-2">Interpretado por ${p.portrayed || 'Não informado'}</p>
        <p class="small mb-2"><strong>Ocupações:</strong> ${ocupacoes.join(', ') || 'Não informadas'}</p>
        <p class="small mb-0"><strong>Temporadas:</strong> ${temporadas.join(', ') || 'Não informadas'}</p>
      </div>
    </article>
  </div>`;
}

// Sem nome digitado: lista todos. Com nome: usa o filtro ?name=
async function buscarPersonagens() {
  const nome = document.getElementById('buscaPersonagem').value.trim();
  let caminho = '/characters?limit=100';
  if (nome !== '') {
    caminho = '/characters?name=' + encodeURIComponent(nome) + '&limit=100';
  }

  avisar('Carregando personagens...');
  try {
    const personagens = await consultar(caminho);
    if (personagens.length === 0) {
      avisar('Nenhum personagem encontrado.', 'warning');
      return;
    }
    document.getElementById('resultados').innerHTML = personagens.map(desenharPersonagem).join('');
  } catch (erro) {
    avisar('Não foi possível carregar os personagens. ' + erro.message, 'danger');
  }
}

// ---------- EPISÓDIOS ----------

function desenharEpisodio(e) {
  const personagens = e.characters || [];
  return `<div class="col-12 col-lg-6">
    <article class="detail-card h-100 p-3 bg-white">
      <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
        <h2 class="h5 mb-0">${e.title}</h2>
        <span class="badge text-bg-success text-nowrap">T${e.season} · E${e.episode}</span>
      </div>
      <p class="small text-secondary mb-2">${e.series} · ${e.air_date}</p>
      <p class="small mb-0"><strong>Personagens:</strong> ${personagens.join(', ') || 'Não informados'}</p>
    </article>
  </div>`;
}

// Sem temporada escolhida: lista todos. Com temporada: usa o filtro ?season=
async function buscarEpisodios() {
  const temporada = document.getElementById('temporada').value;
  let caminho = '/episodes';
  if (temporada !== '') {
    caminho = '/episodes?season=' + temporada;
  }

  avisar('Carregando episódios...');
  try {
    const episodios = await consultar(caminho);
    if (episodios.length === 0) {
      avisar('Nenhum episódio encontrado.', 'warning');
      return;
    }
    document.getElementById('resultados').innerHTML = episodios.map(desenharEpisodio).join('');
  } catch (erro) {
    avisar('Não foi possível carregar os episódios. ' + erro.message, 'danger');
  }
}

carregarFrases();
