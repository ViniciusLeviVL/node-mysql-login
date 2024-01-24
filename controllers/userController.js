import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import connectionQuery from '../db/connectionQuery.js';

//Funcão para registrar o user
export function register(req,res) {

    console.log(req.body);
    return res.send("teste")

    const {name, email, password, passwordConfirm} = req.body;

    if(!name) {
        return res.status(422).json({msg: 'O nome é obrigatório!'})
    }

    if(!email) {
        return res.status(422).json({msg: 'O email é obrigatório!'})
    }

    if(!password) {
        return res.status(422).json({msg: 'A senha é obrigatória!'})
    }

    if (password !== passwordConfirm) {
        return res.status(422).json({msg: 'As senhas não são iguais!'})
    }

    connectionQuery("SELECT email FROM users WHERE email = ?", [email], async (error, result) => {

        //Checando erros e redudancia
        if(error) {
            console.log(error);
        }
        if(result.length > 0) {
            return res.status(422).json({msg: 'Esse email já está cadastrado'})
        }

        //criptogrando a senha 
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        //inserindo os dados no banco de dados
        connectionQuery('INSERT INTO users SET ?', {name: name, email:email, password:hashedPassword}, (error, result) => {
            if(error){
                console.log(error)
                return res.status(500).json({msg: 'Aconteceu um erro no servidor, tente novamente mais tarde.'})
            } else {
                return res.status(201).json({msg: 'Usuário criado com sucesso!'})
            }
        })
    });

}

//funcao para logar o user 
export async function login(req, res) {

    //codicoes da para logar o user
    try {
        const {email, password} = req.body;

        if(!email) {
            return res.status(422).json({msg: 'O email é obrigatório!'})
        }
        
        if(!password) {
            return res.status(422).json({msg: 'A senha é obrigatória!'})
        }

        connectionQuery('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {

            if(!results || !(await bcrypt.compare(password,results[0].password))){
                res.status(401).json({msg: 'E-mail ou senha incorretos'})
            } else {
                const id = results[0].id;
                //criando token para a session
                const token = jwt.sign(
                    {id: id},
                    process.env.JWT_SECRET,
                    {expiresIn: process.env.JWT_EXPIRES_IN}
                );

                console.log("the token is: " + token);

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000 // convertendo para dias
                    ),
                    httpOnly: true
                }
                //setando o cookie no browser
                res.cookie('jwt', token, cookieOptions);
                res.status(200).redirect('/');

            }
        })
    } catch (error) {
        console.log(error)
    }
}


export async function isLoggedIn(req, res, next) {
    console.log(req.cookies);
    if(req.cookies.jwt) {
        try {
            //1)verificar o token
            const decodedToken = await jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

         //2)check se o usuário existe 
            connectionQuery('SELECT * FROM users WHERE id = ?',[decodedToken.id],(error,result) => {
                console.log(result);

                if(!result) {
                    return next();
                } 

                req.user = result[0];
                return next();
            });
        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
}
//
export async function logout(req, res) {
    //sobrescrevendo o cookie
    res.cookie('jwt', 'logout',{
        expires: new Date(Date.now() + 2*1000), //cookie expiration time
        httpOnly: true
    })
    res.status(200).redirect('/');//redirecionando o user para home
}

