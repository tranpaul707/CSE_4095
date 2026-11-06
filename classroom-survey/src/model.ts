export type Status='draft'|'active'|'closed'|'archived';
export type Choice={id:string;choice_text:string;position:number};
export type Question={id:string;question_text:string;question_type:'multiple_choice'|'true_false';position:number;choices:Choice[]};
export type Survey={id:string;title:string;description:string;status:Status;public_slug:string;created_at:string;questions:Question[]};
export type Submission={id:string;survey_id:string;submitted_at:string;anonymous_token:string;answers:{question_id:string;choice_id:string}[]};
export const uid=()=>crypto.randomUUID();
export function validateSurvey(s:Survey){if(!s.title.trim())throw Error('Add a survey title.');if(!s.questions.length)throw Error('Add at least one question.');for(const q of s.questions){if(!q.question_text.trim())throw Error('Give every question some text.');if(q.choices.length<2||q.choices.some(c=>!c.choice_text.trim()))throw Error('Every question needs at least two completed choices.');if(q.question_type==='true_false'&&(q.choices.length!==2||q.choices[0].choice_text!=='True'||q.choices[1].choice_text!=='False'))throw Error('True / False questions need True and False choices.');}}
export function totals(s:Survey,rs:Submission[]){return s.questions.map(q=>({...q,choices:q.choices.map(c=>{const count=rs.filter(r=>r.answers.some(a=>a.question_id===q.id&&a.choice_id===c.id)).length;return {...c,count,percentage:rs.length?count/rs.length*100:0};})}));}
export function csvCell(value:string){const safe=/^[\s]*[=+\-@]/.test(value)?"'"+value:value;return '"'+safe.replaceAll('"','""')+'"';}
export function makeCsv(s:Survey,rs:Submission[]){return [['Survey',s.title],['Description',s.description],['Status',s.status],[],['response_id','submitted_at',...s.questions.map(q=>q.question_text)],...rs.map(r=>[r.id,r.submitted_at,...s.questions.map(q=>q.choices.find(c=>c.id===r.answers.find(a=>a.question_id===q.id)?.choice_id)?.choice_text??'')])].map(row=>row.map(csvCell).join(',')).join('\r\n');}
export function newQuestion():Question{return {id:uid(),question_text:'',question_type:'multiple_choice',position:0,choices:[{id:uid(),choice_text:'',position:0},{id:uid(),choice_text:'',position:1}]};}
