const fs = require('fs')
const path = require('path')
const settings = require('../../config/settings')

const DATA_DIR = settings.dataDir

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadCollection(name) {
  ensureDir()
  const file = path.join(DATA_DIR, `${name}.json`)
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    return []
  }
}

function saveCollection(name, data) {
  ensureDir()
  const file = path.join(DATA_DIR, `${name}.json`)
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

function findById(collection, id) {
  return collection.find((item) => item.id === id)
}

function findByField(collection, field, value) {
  return collection.find((item) => item[field] === value)
}

module.exports = { loadCollection, saveCollection, findById, findByField }
