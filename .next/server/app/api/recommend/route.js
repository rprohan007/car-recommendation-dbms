"use strict";(()=>{var e={};e.id=653,e.ids=[653],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8678:e=>{e.exports=import("pg")},11580:(e,r,t)=>{t.a(e,async(e,a)=>{try{t.r(r),t.d(r,{originalPathname:()=>_,patchFetch:()=>u,requestAsyncStorage:()=>m,routeModule:()=>l,serverHooks:()=>p,staticGenerationAsyncStorage:()=>d});var n=t(49303),i=t(88716),o=t(60670),s=t(33641),c=e([s]);s=(c.then?(await c)():c)[0];let l=new n.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/recommend/route",pathname:"/api/recommend",filename:"route",bundlePath:"app/api/recommend/route"},resolvedPagePath:"/Users/rohanrp/DBMS mini project/src/app/api/recommend/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:m,staticGenerationAsyncStorage:d,serverHooks:p}=l,_="/api/recommend/route";function u(){return(0,o.patchFetch)({serverHooks:p,staticGenerationAsyncStorage:d})}a()}catch(e){a(e)}})},33641:(e,r,t)=>{t.a(e,async(e,a)=>{try{t.r(r),t.d(r,{POST:()=>c,dynamic:()=>u});var n=t(87070),i=t(75748),o=t(52303),s=e([i]);i=(s.then?(await s)():s)[0];let u="force-dynamic";async function c(e){try{let r;try{r=await e.json()}catch{return n.NextResponse.json({error:"Invalid JSON payload in request body"},{status:400})}let{prompt:t="",minPrice:a,maxPrice:s,fuelType:c,transmission:u,minSafety:l}=r,m=void 0!==a&&""!==a?Number(a):null,d=void 0!==s&&""!==s?Number(s):null,p=void 0!==l&&""!==l?Number(l):null;if(null!==m&&(isNaN(m)||m<0))return n.NextResponse.json({error:"minPrice must be a non-negative number"},{status:400});if(null!==d&&(isNaN(d)||d<0))return n.NextResponse.json({error:"maxPrice must be a non-negative number"},{status:400});if(null!==m&&null!==d&&m>d)return n.NextResponse.json({error:"minPrice cannot exceed maxPrice"},{status:400});if(null!==p&&(isNaN(p)||p<0||p>5))return n.NextResponse.json({error:"minSafety must be between 0.0 and 5.0"},{status:400});let _=await (0,o.ke)(t||"reliable safe family car"),v=`[${_.join(",")}]`,f=["cv.is_active = TRUE","cm.launch_status = 'launched'"],h=[v],g=2;null!==m&&(f.push(`cv.ex_showroom_price >= $${g}`),h.push(m),g++),null!==d&&(f.push(`cv.ex_showroom_price <= $${g}`),h.push(d),g++),c&&""!==c.trim()&&(f.push(`cv.fuel_type = $${g}::fuel_enum`),h.push(c.trim()),g++),u&&""!==u.trim()&&(f.push(`cv.transmission = $${g}::trans_enum`),h.push(u.trim()),g++),null!==p&&(f.push(`cv.safety_rating_ncap >= $${g}`),h.push(p),g++);let y=f.length>0?`WHERE ${f.join(" AND ")}`:"",b=`
      SELECT 
        cv.variant_id,
        cv.variant_name,
        cm.model_id,
        cm.model_name,
        m.name AS manufacturer_name,
        cm.body_type,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.transmission,
        cv.engine_displacement_cc,
        cv.power_bhp,
        cv.torque_nm,
        cv.mileage_kmpl,
        cv.safety_rating_ncap,
        cm.seating_capacity,
        COALESCE(
          ARRAY_AGG(f.feature_name ORDER BY f.feature_name) FILTER (WHERE vf.is_standard = TRUE), 
          '{}'
        ) AS standard_features,
        ROUND(
          (CASE 
            WHEN cv.embedding IS NOT NULL 
            THEN (1.0 - (cv.embedding <=> $1::vector))
            ELSE 0.50 
          END)::numeric, 4
        ) AS similarity_score,
        ROUND(
          (
            (CASE 
              WHEN cv.embedding IS NOT NULL 
              THEN (1.0 - (cv.embedding <=> $1::vector))
              ELSE 0.50 
            END) * 0.70 + 
            (COALESCE(cv.safety_rating_ncap, 3.0) / 5.0) * 0.30
          )::numeric, 4
        ) AS combined_relevance_score
      FROM car_variants cv
      JOIN car_models cm ON cv.model_id = cm.model_id
      JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
      LEFT JOIN variant_features vf ON cv.variant_id = vf.variant_id
      LEFT JOIN features f ON vf.feature_id = f.feature_id
      ${y}
      GROUP BY 
        cv.variant_id,
        cv.variant_name,
        cm.model_id,
        cm.model_name,
        m.name,
        cm.body_type,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.transmission,
        cv.engine_displacement_cc,
        cv.power_bhp,
        cv.torque_nm,
        cv.mileage_kmpl,
        cv.safety_rating_ncap,
        cm.seating_capacity,
        cv.embedding
      ORDER BY combined_relevance_score DESC, cv.safety_rating_ncap DESC NULLS LAST
      LIMIT 5;
    `,N=await (0,i.I)(b,h);try{await (0,i.I)(`INSERT INTO customer_searches (
          min_budget, max_budget, preferred_fuel, preferred_transmission, 
          min_safety_rating, search_query
        ) VALUES ($1, $2, $3::fuel_enum, $4::trans_enum, $5, $6)`,[m,d,c||null,u||null,p,t||null])}catch(e){console.warn("Non-blocking: Failed to record search audit log:",e)}return n.NextResponse.json({success:!0,count:N.rows.length,query:{prompt:t,minPrice:m,maxPrice:d,fuelType:c||null,transmission:u||null,minSafety:p},data:N.rows})}catch(e){return console.error("Error in /api/recommend:",e),n.NextResponse.json({success:!1,error:"Failed to process car recommendation query",details:void 0},{status:500})}}a()}catch(e){a(e)}})},75748:(e,r,t)=>{t.a(e,async(e,a)=>{try{t.d(r,{I:()=>o,d:()=>c});var n=t(8678),i=e([n]);n=(i.then?(await i)():i)[0];let s=process.env.DATABASE_URL||"postgresql://postgres:postgres@localhost:5432/cardb",c=global.pgPool||new n.Pool({connectionString:s,max:10,idleTimeoutMillis:3e4,connectionTimeoutMillis:5e3});async function o(e,r){Date.now();try{let t=await c.query(e,r);return Date.now(),t}catch(t){throw console.error("Database query execution error:",{query:e,params:r,error:t}),t}}c.on("error",e=>{console.error("Unexpected error on idle PostgreSQL client:",e)}),a()}catch(e){a(e)}})},52303:(e,r,t)=>{t.d(r,{ke:()=>a});async function a(e){let r=(e||"").trim();if(!r)return Array(1536).fill(0);let t=process.env.OPENAI_API_KEY;if(t&&"your-openai-api-key-here"!==t)try{let e=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({input:r,model:"text-embedding-3-small",dimensions:1536})});if(e.ok){let r=await e.json();if(r?.data?.[0]?.embedding)return r.data[0].embedding}else{let r=await e.text();console.warn(`OpenAI embedding API returned status ${e.status}: ${r}. Using fallback.`)}}catch(e){console.warn("Network error calling OpenAI embedding API. Falling back to local embedding generator:",e)}return function(e){let r=(e||"").trim().toLowerCase(),t=Array(1536).fill(0),a=0;for(let e=0;e<r.length;e++)a=(a<<5)-a+r.charCodeAt(e)|0;let n=Math.abs(a)+1,i=/(safe|ncap|airbag|adas|brak|guard)/i.test(r)?1.5:1,o=/(electric|ev|battery|range|charge)/i.test(r)?1.8:1,s=/(suv|ground|high|4x4|awd)/i.test(r)?1.4:1,c=/(sunroof|leather|ventilated|jbl|luxury|screen)/i.test(r)?1.3:1,u=0;for(let e=1;e<=1536;e++){let a=.55*Math.sin(.031*e+.73*n)*i+.45*Math.cos(.017*e+.12*r.length)*o*s*c;u+=(a=Math.round(1e5*a)/1e5)*a,t[e-1]=a}let l=Math.sqrt(u)||1;return t.map(e=>Number((e/l).toFixed(6)))}(r)}}};var r=require("../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),a=r.X(0,[276,972],()=>t(11580));module.exports=a})();