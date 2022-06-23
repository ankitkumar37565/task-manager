const mongoose = require('mongoose');
const Schema= mongoose.Schema;

const projectSchema= new Schema({
    name:{type:string, required:true},
    description:{type:string, required:true},
    status:{type:string,required:true}
})
const project=mongoose.model('project',projectSchema);
module.exports=project;