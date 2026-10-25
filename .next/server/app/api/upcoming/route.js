"use strict";(()=>{var e={};e.id=335,e.ids=[335],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8678:e=>{e.exports=import("pg")},2789:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.r(t),r.d(t,{originalPathname:()=>h,patchFetch:()=>u,requestAsyncStorage:()=>l,routeModule:()=>p,serverHooks:()=>m,staticGenerationAsyncStorage:()=>d});var n=r(49303),o=r(88716),i=r(60670),s=r(13661),c=e([s]);s=(c.then?(await c)():c)[0];let p=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/upcoming/route",pathname:"/api/upcoming",filename:"route",bundlePath:"app/api/upcoming/route"},resolvedPagePath:"/Users/rohanrp/DBMS mini project/src/app/api/upcoming/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:l,staticGenerationAsyncStorage:d,serverHooks:m}=p,h="/api/upcoming/route";function u(){return(0,i.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:d})}a()}catch(e){a(e)}})},13661:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.r(t),r.d(t,{GET:()=>s,dynamic:()=>c});var n=r(87070),o=r(75748),i=e([o]);o=(i.then?(await i)():i)[0];let c="force-dynamic";async function s(e){try{let{searchParams:t}=new URL(e.url),r=t.get("bodyType"),a=t.get("manufacturer"),i=[],s=[],c=1;r&&""!==r.trim()&&(i.push(`body_type = $${c}::body_type`),s.push(r.trim()),c++),a&&""!==a.trim()&&(i.push(`manufacturer_name ILIKE $${c}`),s.push(`%${a.trim()}%`),c++);let u=i.length>0?`WHERE ${i.join(" AND ")}`:"",p=`
      SELECT 
        model_id,
        model_name,
        manufacturer_name,
        country_origin,
        body_type,
        seating_capacity,
        expected_launch_date,
        days_until_launch,
        launch_status,
        announced_variants_count,
        estimated_starting_price,
        estimated_top_price
      FROM v_upcoming_launches
      ${u}
      ORDER BY expected_launch_date ASC NULLS LAST, model_name ASC;
    `,l=await (0,o.I)(p,s);return n.NextResponse.json({success:!0,count:l.rows.length,filters:{bodyType:r||null,manufacturer:a||null},data:l.rows})}catch(e){return console.error("Error in /api/upcoming:",e),n.NextResponse.json({success:!1,error:"Failed to retrieve upcoming vehicle launches",details:void 0},{status:500})}}a()}catch(e){a(e)}})},75748:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.d(t,{I:()=>i,d:()=>c});var n=r(8678),o=e([n]);n=(o.then?(await o)():o)[0];let s=process.env.DATABASE_URL||"postgresql://postgres:postgres@localhost:5432/cardb",c=global.pgPool||new n.Pool({connectionString:s,max:10,idleTimeoutMillis:3e4,connectionTimeoutMillis:5e3});async function i(e,t){Date.now();try{let r=await c.query(e,t);return Date.now(),r}catch(r){throw console.error("Database query execution error:",{query:e,params:t,error:r}),r}}c.on("error",e=>{console.error("Unexpected error on idle PostgreSQL client:",e)}),a()}catch(e){a(e)}})}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[276,972],()=>r(2789));module.exports=a})();