
import express from 'express';
import cors from 'cors';
import submissionRoute from './routes/submissions';
const app = express();
app.use(cors()); app.use(express.json());
app.use('/api/submissions', submissionRoute);
app.get('/health',(req,res)=>res.json({status:'JAKA.LMS backend OK'}));
app.listen(3001,()=>console.log('Backend running on 3001'));
