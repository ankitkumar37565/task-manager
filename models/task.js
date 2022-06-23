const mongoose=require('mongoose');
const Schema=mongoose.Schema;


const taskSchema=new schema({
    name:{type:string, required:true},
    description:{type:string, required:true}
});
const task=mongoose.model('task',taskSchema);
module.exports=task;