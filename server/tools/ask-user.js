import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export default async function askUser (question) {
  return new Promise((resolve, reject) => {
    rl.question(question, function (answer) {
      resolve(answer)
      rl.close()
    })
  })
}
