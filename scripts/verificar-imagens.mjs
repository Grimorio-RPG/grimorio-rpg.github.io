// Verifica as imagens no Storage.
//
// O que se ganha aqui é peso: um mapa de 1,5 MB virava ~2 MB de base64 numa
// coluna jsonb, subia inteiro a cada republicação e descia inteiro para cada
// jogador. O que se arrisca é o contrário — um caminho montado errado não
// quebra nada visível, só faz o banco recusar a leitura e a imagem "não
// aparecer", que é o defeito mais chato de perseguir.
//
// A primeira pasta do caminho é a mesa, e é por ela que as políticas do banco
// decidem quem lê. Se esta forma mudar sem `storage.sql` mudar junto, todo
// mundo fica do lado de fora.

import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'img-'))
// `--define` porque o módulo puxa o cliente do Supabase, que lê
// `import.meta.env` — coisa do Vite, que no Node não existe.
execSync(
  `npx esbuild src/lib/sync/imagens.ts --bundle --outfile=${join(dir, 'imagens.js')} ` +
    `--format=esm --log-level=error ` +
    `--define:import.meta.env.VITE_SUPABASE_URL='""' ` +
    `--define:import.meta.env.VITE_SUPABASE_ANON_KEY='""'`,
)
const { caminhoDaImagem, ehCaminhoDeStorage, tipoDoDataUrl, bytesDoDataUrl } = await import(
  pathToFileURL(join(dir, 'imagens.js')).href
)

let falhas = 0
let testes = 0
function checar(nome, condicao, detalhe = '') {
  testes++
  if (condicao) return
  falhas++
  console.error(`  ✗ ${nome}${detalhe ? `\n      ${detalhe}` : ''}`)
}

const MESA = '11111111-2222-3333-4444-555555555555'

// ---------------------------------------------------------------------------
console.log('O caminho carrega a permissão')

const caminho = caminhoDaImagem(MESA, 'mapas', 'mapa-1', 'webp')
checar('a PRIMEIRA pasta é a mesa', caminho.split('/')[0] === MESA, caminho)
checar('depois vem a pasta do tipo', caminho.split('/')[1] === 'mapas')
checar('e o arquivo leva o id do mapa', caminho.split('/')[2] === 'mapa-1.webp')
checar('nada de barra sobrando', !caminho.includes('//') && !caminho.startsWith('/'))

// A política do banco faz `((storage.foldername(name))[1])::uuid`. Um caminho
// que não comece com um uuid é recusado — e é essa a intenção.
checar('a primeira pasta tem cara de uuid',
  /^[0-9a-f-]{36}$/i.test(caminho.split('/')[0]))

// ---------------------------------------------------------------------------
console.log('Distinguir caminho de imagem embutida')
//
// O app tem de conviver com os dois: mapas de antes disto existir, e mapas de
// quem ainda não rodou o storage.sql, continuam com a imagem embutida.

checar('caminho do storage é reconhecido', ehCaminhoDeStorage(caminho) === true)
checar('data URL não é caminho', ehCaminhoDeStorage('data:image/png;base64,AAA') === false)
checar('URL externa não é caminho', ehCaminhoDeStorage('https://exemplo.com/a.png') === false)
checar('vazio não é caminho', ehCaminhoDeStorage('') === false)

// ---------------------------------------------------------------------------
console.log('O tipo do arquivo sai do próprio data URL')

checar('png', tipoDoDataUrl('data:image/png;base64,AA').ext === 'png')
checar('e o mime junto', tipoDoDataUrl('data:image/png;base64,AA').mime === 'image/png')
// "jpeg" no mime, "jpg" no arquivo: é o que todo mundo espera ver.
checar('jpeg vira jpg no nome', tipoDoDataUrl('data:image/jpeg;base64,AA').ext === 'jpg')
checar('mas o mime continua jpeg', tipoDoDataUrl('data:image/jpeg;base64,AA').mime === 'image/jpeg')
checar('webp', tipoDoDataUrl('data:image/webp;base64,AA').ext === 'webp')
// O balde só aceita alguns tipos; um lixo qualquer não pode virar caminho com
// extensão inventada.
checar('lixo cai num padrão seguro', tipoDoDataUrl('nada disso').ext === 'webp')

// ---------------------------------------------------------------------------
console.log('Os bytes')

// "SGVsbG8=" é "Hello" em base64.
const bytes = bytesDoDataUrl('data:image/png;base64,SGVsbG8=')
checar('decodifica o base64', bytes.length === 5, `deu ${bytes.length}`)
checar('e os bytes são os certos',
  String.fromCharCode(...bytes) === 'Hello',
  String.fromCharCode(...bytes))
checar('sai como Uint8Array', bytes instanceof Uint8Array)

// ---------------------------------------------------------------------------
console.log('O SQL combina com o código')
//
// A política lê a PRIMEIRA pasta do caminho. Se alguém trocar a ordem no
// `caminhoDaImagem` sem mexer no SQL, o banco passa a recusar tudo — e o
// sintoma é "a imagem não aparece", que não aponta para lugar nenhum.

const sql = readFileSync('supabase/storage.sql', 'utf8')
checar('o SQL existe e cita o balde', sql.includes("'imagens'"))

// O balde PRIVADO é o ponto todo: um mapa que o DM não revelou é segredo dele,
// e balde público entrega o arquivo a quem tiver o link. A checagem olha os dois
// lugares em que o "false" precisa estar — a criação e o `on conflict` —, porque
// olhar só um deixaria passar um balde criado público e "corrigido" depois, ou o
// contrário. A primeira versão desta checagem tinha um `||` que aceitava
// qualquer um dos dois, e uma sabotagem que tornava o balde público passou.
const semEspacos = sql.replace(/\s+/g, ' ')
checar('o balde nasce privado',
  semEspacos.includes("values ( 'imagens', 'imagens', false,"),
  semEspacos.match(/values \([^)]*/)?.[0])
checar('e continua privado se já existir', semEspacos.includes('set public = false'))
checar('em lugar nenhum ele é criado público',
  !/values \( 'imagens', 'imagens', true/.test(semEspacos) && !/set public = true/.test(semEspacos))
checar('a política lê a primeira pasta como mesa',
  sql.includes('(storage.foldername(name))[1]'))
checar('e confere que quem lê é membro', sql.includes('public.eh_membro'))
checar('trocar e apagar são só do dono', (sql.match(/owner = auth\.uid\(\)/g) ?? []).length >= 2)
checar('o balde limita o tamanho', sql.includes('file_size_limit'))
checar('e só aceita imagem', sql.includes('allowed_mime_types'))

// O nome do balde no SQL e no código têm de ser o mesmo.
const codigo = readFileSync('src/lib/sync/imagens.ts', 'utf8')
const balde = codigo.match(/const BALDE = '([^']+)'/)?.[1]
checar('o balde do código é o mesmo do SQL', balde === 'imagens', `código diz ${balde}`)

// ---------------------------------------------------------------------------
console.log('O app sobrevive sem o Storage')
//
// Quem não rodou o storage.sql, ou usa o app sem nuvem, não pode ficar sem
// mapa. O caminho antigo continua valendo.

checar('o mapa guarda o caminho como opcional',
  readFileSync('src/types.ts', 'utf8').includes('imagemPath?: string'))
checar('e a publicação antiga só é pulada quando há caminho',
  readFileSync('src/hooks/useMundo.ts', 'utf8').includes('if (mapa.imagemPath) continue'))

if (falhas > 0) {
  console.error(`\n✗ ${falhas} de ${testes} verificações de imagem falharam`)
  process.exit(1)
}
console.log(`✓ ${testes} verificações de imagem passaram`)
