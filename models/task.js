const mongoose=require('mongoose');
const Schema=mongoose.Schema;


const taskSchema=new Schema({
    name:{type:String, required:true},
    description:{type:String, required:true}
});
const task=mongoose.model('task',taskSchema);
module.exports=task;