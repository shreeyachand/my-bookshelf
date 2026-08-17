import YAML from 'yaml'

const modules = import.meta.glob('./books/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const parsed = Object.values(modules).map((raw) => YAML.parse(raw))

parsed.sort((a, b) => a.order - b.order)
parsed.forEach((book) => delete book.order)

export const books = parsed