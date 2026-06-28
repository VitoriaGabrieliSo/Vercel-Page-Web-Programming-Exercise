// Botão no header que abre/fecha o painel
const botaoAbrirPainel = document.getElementById('botao-abrir-painel');

// O painel inteiro (div que aparece/desaparece)
const painelDeBusca = document.getElementById('painel-busca');

// O campo de texto onde o usuário digita
const campoBusca = document.getElementById('campo-termo-busca');

// O botão "Buscar" dentro do painel
const botaoExecutarBusca = document.getElementById('botao-executar-busca');

// Onde aparecem as mensagens de erro de validação
const textoErroValidacao = document.getElementById('texto-erro-validacao');

// DIV ONDE VÃO FICAR OS RESULTADOS DA BUSCA
const listaDosResultados = document.getElementById('lista-de-resultados');

// DIV ONDE VÃO FICAR OS FAVORITOS
const listaDeFavoritos = document.getElementById('lista-de-favoritos');


// 2. ABRIR E FECHAR O PAINEL

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

// Fecha o painel se o usuário clicar em qualquer lugar fora dele
document.addEventListener('click', function (evento) {
  const clicouForaDoPatinel  = !painelDeBusca.contains(evento.target);
  const clicouForaDoBotao    = evento.target !== botaoAbrirPainel;

  if (clicouForaDoPatinel && clicouForaDoBotao) {
    painelDeBusca.style.display = 'none';
  }
});

// 3. TROCAR ENTRE AS ABAS
// Mostra a seção de Resultados ou de Favoritos, e destaca
// visualmente a aba que está ativa.

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

// 4. VALIDAÇÃO DO CAMPO DE BUSCA
// Critério 4: não permite campo vazio ou menos de 3 caracteres.
// Critério 5: exibe mensagem de erro na própria página (não alert).
// Retorna true se tudo ok, false se há erro.

function validarCampoDeBusca(termoBuscado) {

  // Caso 1: campo vazio
  if (!termoBuscado) {
    textoErroValidacao.textContent = 'Por favor, digite um termo para buscar.';
    return false;
  }

  // Caso 2: menos de 3 caracteres
  if (termoBuscado.length < 3) {
    textoErroValidacao.textContent = 'O termo deve ter pelo menos 3 caracteres.';
    return false;
  }
  textoErroValidacao.textContent = '';
  return true;
}

// COMUNICAÇÃO COM A API DO GITHUB (AJAX + JSON)

async function buscarReposNoGithub(termoBuscado) {

  const urlDaApi = `https://api.github.com/search/repositories?q=${encodeURIComponent(termoBuscado)}&per_page=10&sort=stars`;

  // fetch() faz a requisição HTTP para a API
  // await pausa a função até a resposta chegar
  const resposta = await fetch(urlDaApi, {
    headers: { 'Accept': 'application/vnd.github.v3+json' }
  });

  // Converte o corpo da resposta de texto JSON para objeto JavaScript
  const dadosJson = await resposta.json();
  return dadosJson.items;
}


// EXIBE OS CARDS DE RESULTADO NA TELA
// Recebe o array de repositórios e gera o HTML de cada card,
// injetando tudo de uma vez dentro da div de resultados.

function exibirCardsDeResultado(listaDeRepos) {

  // Nenhum resultado encontrado
  if (!listaDeRepos || listaDeRepos.length === 0) {
    listaDosResultados.innerHTML = '<p class="texto-lista-vazia">Nenhum repositório encontrado.</p>';
    return;
  }

  // Para cada repositório, monta uma string HTML com as infos
  // .map() percorre o array e retorna um novo array de strings HTML
  // .join('') junta todas as strings em uma só (sem separador)
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

// EVENTO: Executar a busca ao clicar no botão "Buscar"
// Lê o campo, valida, chama a API e exibe os resultados.

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

//pressionar Enter no campo também dispara a busca
campoBusca.addEventListener('keydown', function (evento) {
  if (evento.key === 'Enter') {
    botaoExecutarBusca.click();
  }
});

// SALVA UM FAVORITO NO localStorage
// Critério da proposta: favoritos devem ser salvos no Front-End
// usando uma API localStorage.
// localStorage.getItem / setItem são os métodos da API.

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
// Filtra o array removendo o item com o id informado,
// depois salva o array novo de volta.

function removerDosFavoritos(idDoRepo) {

  const favoritosExistentes = JSON.parse(localStorage.getItem('favoritos') || '[]');

  const favoritosAtualizados = favoritosExistentes.filter(function (repo) {
    return repo.id !== idDoRepo;
  });

  localStorage.setItem('favoritos', JSON.stringify(favoritosAtualizados));

  exibirListaDeFavoritos();
}

// EXIBE A LISTA DE FAVORITOS NA TELA
// Lê os favoritos do localStorage e gera os cards.

function exibirListaDeFavoritos() {

  // Lê o array de favoritos do localStorage
  const listaSalva = JSON.parse(localStorage.getItem('favoritos') || '[]');

  // Se não tiver nenhum favorito salvo
  if (listaSalva.length === 0) {
    listaDeFavoritos.innerHTML = '<p class="texto-lista-vazia">Nenhum favorito salvo ainda.</p>';
    return;
  }

  // Gera os cards dos favoritos
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
