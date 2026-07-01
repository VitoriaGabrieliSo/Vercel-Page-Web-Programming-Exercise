const botaoAbrirPainel = document.getElementById('botao-abrir-painel');

// div que aparece e desaparece ao clicar 
const painelDeBusca = document.getElementById('painel-busca');

const campoBusca = document.getElementById('campo-termo-busca');

const botaoExecutarBusca = document.getElementById('botao-executar-busca');

const textoErroValidacao = document.getElementById('texto-erro-validacao');

// DIV COM RESULTADOS DA BUSCA
const listaDosResultados = document.getElementById('lista-de-resultados');

// DIV COM FAVORITOS
const listaDeFavoritos = document.getElementById('lista-de-favoritos');

botaoAbrirPainel.addEventListener('click', function () {

  // Verifica se o painel está visível no momento
  const painelEstaAberto = painelDeBusca.style.display === 'block';

  if (painelEstaAberto) {
    painelDeBusca.style.display = 'none';
  } else {
    painelDeBusca.style.display = 'block';
    exibirListaDeFavoritos();
  }
});

// se clicar em qualquer lugar fora dele Fecha
document.addEventListener('click', function (evento) {
  const clicouForaDoPatinel  = !painelDeBusca.contains(evento.target);
  const clicouForaDoBotao    = evento.target !== botaoAbrirPainel;

  if (clicouForaDoPatinel && clicouForaDoBotao) {
    painelDeBusca.style.display = 'none';
  }
});

function trocarAba(nomeAba) {

  // Pega as duas seções e as duas abas
  const secaoResultados = document.getElementById('secao-resultados');
  const secaoFavoritos  = document.getElementById('secao-favoritos');
  const abaResultados   = document.getElementById('aba-resultados');
  const abaFavoritos    = document.getElementById('aba-favoritos');

  if (nomeAba === 'resultados') {
    secaoResultados.style.display = 'block';
    secaoFavoritos.style.display  = 'none';
    abaResultados.classList.add('aba-ativa');
    abaFavoritos.classList.remove('aba-ativa');
  }

  if (nomeAba === 'favoritos') {
    secaoResultados.style.display = 'none';
    secaoFavoritos.style.display  = 'block';
    abaResultados.classList.remove('aba-ativa');
    abaFavoritos.classList.add('aba-ativa');
    exibirListaDeFavoritos();
  }
}

// VALIDAÇÃO DO CAMPO DE BUSCA
function validarCampoDeBusca(termoBuscado) {

  // campo vazio
  if (!termoBuscado) {
    textoErroValidacao.textContent = 'Por favor, digite um termo para buscar.';
    return false;
  }

  // menos de 3 caracteres
  if (termoBuscado.length < 3) {
    textoErroValidacao.textContent = 'O termo deve ter pelo menos 3 caracteres.';
    return false;
  }
  textoErroValidacao.textContent = '';
  return true;
}

//AJAX + JSON
async function buscarReposNoGithub(termoBuscado) {

  const urlDaApi = `https://api.github.com/search/repositories?q=${encodeURIComponent(termoBuscado)}&per_page=10&sort=stars`;

  // fetch() faz a requisição HTTP para a API, await pausa a função até a resposta chegar
  const resposta = await fetch(urlDaApi, {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  });

  // Converte JSON para objeto JavaScript
  const dadosJson = await resposta.json();
  return dadosJson.items;
}

// Recebe o array de repositórios e gera o HTML de cada card,
function exibirCardsDeResultado(listaDeRepos) {

  // Nenhum resultado encontrado
  if (!listaDeRepos || listaDeRepos.length === 0) {
    listaDosResultados.innerHTML = '<p class="texto-lista-vazia">Nenhum repositório encontrado.</p>';
    return;
  }

  // Para cada repositório, monta uma string HTML com as infos
  // .map() percorre o array e retorna um novo array de strings HTML
  // .join('') junta todas as strings em uma só
  listaDosResultados.innerHTML = listaDeRepos.map(function (repo) {

    const nomeSeguro = repo.full_name.replace(/'/g, "\\'");
    const descricaoSegura = (repo.description || '').replace(/'/g, "\\'").replace(/"/g, '\\"');

    return `
      <div class="card-repositorio">

        <div class="card-info">
          <a class="card-nome-repo" href="${repo.html_url}" target="_blank">
            ${repo.full_name}
          </a>
          <p class="card-descricao">${repo.description || 'Sem descrição'}</p>
          <div class="card-detalhes">
            <span>☆ ${repo.stargazers_count.toLocaleString()}</span>
            <span>${repo.language || '—'}</span>
          </div>
        </div>

        <div class="card-acoes">
          <button
            class="botao-favoritar"
            onclick="salvarNosRavoritos(${repo.id}, '${nomeSeguro}', '${descricaoSegura}', '${repo.html_url}', ${repo.stargazers_count})"
          >
            ☆ Favoritar
          </button>
        </div>

      </div>
    `;
  }).join('');
}

botaoExecutarBusca.addEventListener('click', async function () {

  const termoBuscado = campoBusca.value.trim();

  // Só continua se a validação passar
  if (!validarCampoDeBusca(termoBuscado)) return;

  listaDosResultados.innerHTML = '<p class="texto-lista-vazia">Buscando...</p>';
  trocarAba('resultados');

  try {
    const listaDeRepos = await buscarReposNoGithub(termoBuscado);
    exibirCardsDeResultado(listaDeRepos);

  } catch (erro) {
    listaDosResultados.innerHTML = '<p class="texto-lista-vazia">Erro ao buscar. Verifique sua conexão.</p>';
  }
});

//pressionar Enter
campoBusca.addEventListener('keydown', function (evento) {
  if (evento.key === 'Enter') {
    botaoExecutarBusca.click();
  }
});

// SALVA UM FAVORITO NO localStorage
function salvarNosRavoritos(idDoRepo, nomeDoRepo, descricaoDoRepo, urlDoRepo, quantidadeEstrelas) {

  const favoritosExistentes = JSON.parse(localStorage.getItem('favoritos') || '[]');

  const jaExisteNosFavoritos = favoritosExistentes.find(function (repo) {
    return repo.id === idDoRepo;
  });

  if (jaExisteNosFavoritos) return;

  const novoFavorito = {
    id:       idDoRepo,
    nome:     nomeDoRepo,
    descricao: descricaoDoRepo,
    url:      urlDoRepo,
    estrelas: quantidadeEstrelas
  };

  favoritosExistentes.push(novoFavorito);
  localStorage.setItem('favoritos', JSON.stringify(favoritosExistentes));

  exibirListaDeFavoritos();
}

// REMOVE UM FAVORITO DO localStorage
function removerDosFavoritos(idDoRepo) {

  const favoritosExistentes = JSON.parse(localStorage.getItem('favoritos') || '[]');

  const favoritosAtualizados = favoritosExistentes.filter(function (repo) {
    return repo.id !== idDoRepo;
  });

  localStorage.setItem('favoritos', JSON.stringify(favoritosAtualizados));

  exibirListaDeFavoritos();
}

// Lê os favoritos do localStorage e gera os cards.
function exibirListaDeFavoritos() {

  // Lê o array de favoritos
  const listaSalva = JSON.parse(localStorage.getItem('favoritos') || '[]');

  // sem favoritos salvos
  if (listaSalva.length === 0) {
    listaDeFavoritos.innerHTML = '<p class="texto-lista-vazia">Nenhum favorito salvo ainda.</p>';
    return;
  }

  // cards dos favoritos
  listaDeFavoritos.innerHTML = listaSalva.map(function (repo) {
    return `
      <div class="card-repositorio">

        <div class="card-info">
          <a class="card-nome-repo" href="${repo.url}" target="_blank">
            ${repo.nome}
          </a>
          <p class="card-descricao">${repo.descricao || 'Sem descrição'}</p>
          <div class="card-detalhes">
            <span>☆ ${repo.estrelas.toLocaleString()}</span>
          </div>
        </div>

        <div class="card-acoes">
          <button
            class="botao-remover"
            onclick="removerDosFavoritos(${repo.id})"
          >
            ✕ Remover
          </button>
        </div>

      </div>
    `;
  }).join('');
}
