import express from 'express'
import dotenv from 'dotenv'
import {genSaltSync,hashSync,compareSync} from 'bcrypt'
import {StreamChat} from 'stream-chat'
import prisma from './lib/prismaConfig'

dotenv.config();


try {
const {PORT, STREAM_API_KEY, STREAM_API_SECRET}=process.env;
const client =StreamChat.getInstance(STREAM_API_KEY! ,STREAM_API_SECRET);
const app=express();

app.use(express.json());
const salt=genSaltSync(10)
interface User{
    id:string;
    email:string | any;
    hashed_password:string | any;
}

const USERS:User[]=[];

app.post('/register',async (req,res)=>{
    const {email ,password}=req.body;

    if(!email || !password){
        return res.status(400).json({
            message:'Email and password are required.'
        })
    }

    if(password.length<6){
        return res.status(400).json({
            message:'password must be at least 6 charachters!!.'
        });
    }
    const existingUser=await prisma.user.findUnique({
        where:{
            email:email
        },
        select:{
            id:true,
            email:true,
            hashed_password:true
        }
    })
    if(existingUser){
        return res.status(400).json({
            message:'User already exists!!.',
        })
    }
    try {
        const hashed_password=hashSync(password,salt) as string ;
        // const id =Math.random().toString(36).slice(2);
        const user=await prisma.user.create({
            data:{
                email:email,
                hashed_password:hashed_password
            }
        })
        console.log(user)

        await client.upsertUser({
            id:user.id,
            email:email,
            name:email,
        })
        const token =client.createToken(user.id);
        return  res.status(200).json({
            token,
            user:{
                id:user.id,
                email:user.email
            },
        })
    } catch (err) {
        res.status(500).json({error:"error user "});
    }
})

app.post('/login',async (req,res)=>{
    const {email,password}=req.body;
    // const user=USERS.find((user)=>user.email==email);
    const user= await  prisma.user.findUnique({
        where:{
            email:email,
        }
    })
    if(!user|| !compareSync(password,user?.hashed_password as string)){
        return res.status(400).json({
            message:"invalid credentials",
        })
    }
    const token=client.createToken(user.id);

    return res.status(200).json({
        token,
        user:{
            id:user.id,
            email:user.email,
        }
    })
})
app.listen(PORT,()=>{
    console.log(`server us listening on port ${PORT}`);
})
    
} catch (error) {
    console.log(error)
}
