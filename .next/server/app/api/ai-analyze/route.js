(()=>{var e={};e.id=2931,e.ids=[2931],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11997:e=>{"use strict";e.exports=require("punycode")},27910:e=>{"use strict";e.exports=require("stream")},28354:e=>{"use strict";e.exports=require("util")},29021:e=>{"use strict";e.exports=require("fs")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:e=>{"use strict";e.exports=require("path")},37830:e=>{"use strict";e.exports=require("node:stream/web")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},52039:(e,r,t)=>{"use strict";t.r(r),t.d(r,{patchFetch:()=>h,routeModule:()=>c,serverHooks:()=>x,workAsyncStorage:()=>l,workUnitAsyncStorage:()=>d});var s={};t.r(s),t.d(s,{POST:()=>p});var o=t(96559),a=t(48088),u=t(37719),i=t(32190);let n=new(t(37647)).Ay({apiKey:process.env.OPENAI_API_KEY});async function p(e){try{let{feedbackText:r,currentModel:t}=await e.json(),s=`
あなたは教育観モデルのアシスタントです。
以下の現在の教育観モデルに対して、振り返り文章を考慮し、
教育観、評価観点の重視、言語活動の重視、育てたい子どもの姿を
具体的かつ端的に更新してください。

現在のモデル：
教育観：${t.philosophy}
評価観点の重視：${t.evaluationFocus}
言語活動の重視：${t.languageFocus}
育てたい子どもの姿：${t.childFocus}

振り返り文章：
${r}

更新案をJSON形式で次のキーで返してください：
philosophy, evaluationFocus, languageFocus, childFocus
`,o=await n.chat.completions.create({model:"gpt-4",messages:[{role:"user",content:s}],temperature:.7}),a=o.choices[0].message?.content||"{}",u={};try{u=JSON.parse(a)}catch{return i.NextResponse.json({error:"AIの返答がJSON形式ではありません。"},{status:500})}return i.NextResponse.json(u)}catch(e){return console.error(e),i.NextResponse.json({error:"解析に失敗しました。"},{status:500})}}let c=new o.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/ai-analyze/route",pathname:"/api/ai-analyze",filename:"route",bundlePath:"app/api/ai-analyze/route"},resolvedPagePath:"C:\\Users\\yukia\\Downloads\\koku-lesson-planner\\app\\api\\ai-analyze\\route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:l,workUnitAsyncStorage:d,serverHooks:x}=c;function h(){return(0,u.patchFetch)({workAsyncStorage:l,workUnitAsyncStorage:d})}},55591:e=>{"use strict";e.exports=require("https")},57075:e=>{"use strict";e.exports=require("node:stream")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:e=>{"use strict";e.exports=require("node:fs")},73566:e=>{"use strict";e.exports=require("worker_threads")},74075:e=>{"use strict";e.exports=require("zlib")},78335:()=>{},79551:e=>{"use strict";e.exports=require("url")},81630:e=>{"use strict";e.exports=require("http")},96487:()=>{}};var r=require("../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[7719,580,3079,5381,7647],()=>t(52039));module.exports=s})();