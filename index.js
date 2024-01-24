import dotenv from 'dotenv'
import express from 'express'

import authRouter from './routes/auth.js'

dotenv.config()

const app = express()

app.use(express.json())

app.use('/auth', authRouter)

// rota pública
app.get('/', (req, res) => {
  res.status(200).json({msg: "Bem vindo!"})
})

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});