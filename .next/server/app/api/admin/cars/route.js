"use strict";(()=>{var e={};e.id=893,e.ids=[893],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},86624:e=>{e.exports=require("querystring")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},8678:e=>{e.exports=import("pg")},46552:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.r(r),t.d(r,{originalPathname:()=>v,patchFetch:()=>c,requestAsyncStorage:()=>d,routeModule:()=>l,serverHooks:()=>m,staticGenerationAsyncStorage:()=>p});var a=t(49303),i=t(88716),n=t(60670),o=t(57955),u=e([o]);o=(u.then?(await u)():u)[0];let l=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/admin/cars/route",pathname:"/api/admin/cars",filename:"route",bundlePath:"app/api/admin/cars/route"},resolvedPagePath:"/Users/rohanrp/DBMS mini project/src/app/api/admin/cars/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:d,staticGenerationAsyncStorage:p,serverHooks:m}=l,v="/api/admin/cars/route";function c(){return(0,n.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:p})}s()}catch(e){s(e)}})},57955:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.r(r),t.d(r,{DELETE:()=>v,GET:()=>d,POST:()=>p,PUT:()=>m,dynamic:()=>h});var a=t(87070),i=t(75571),n=t(95456),o=t(75748),u=t(52303),c=e([n,o]);[n,o]=c.then?(await c)():c;let h="force-dynamic";async function l(){let e=await (0,i.getServerSession)(n.L);if(!e||!e.user)return{authorized:!1,error:"Forbidden: Insufficient privileges. Authentication required."};let r=e.user.role?.toUpperCase();return"ADMIN"!==r?{authorized:!1,error:"Forbidden: Insufficient privileges. ADMIN role required."}:{authorized:!0,session:e}}async function d(e){let r=await l();if(!r.authorized)return a.NextResponse.json({success:!1,error:r.error},{status:403});try{let{searchParams:r}=new URL(e.url),t=Math.min(Math.max(parseInt(r.get("limit")||"50",10),1),100),s=Math.max(parseInt(r.get("offset")||"0",10),0),i=r.get("modelId"),n=[],u=[],c=1;i&&(n.push(`cv.model_id = $${c}`),u.push(parseInt(i,10)),c++);let l=n.length>0?`WHERE ${n.join(" AND ")}`:"",d=`
      SELECT 
        cv.variant_id,
        cv.variant_name,
        cv.model_id,
        cm.model_name,
        cm.body_type,
        m.manufacturer_id,
        m.name AS manufacturer_name,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.transmission,
        cv.engine_displacement_cc,
        cv.power_bhp,
        cv.torque_nm,
        cv.mileage_kmpl,
        cv.safety_rating_ncap,
        cv.is_active,
        cv.created_at,
        COUNT(vf.feature_id) AS total_features_count
      FROM car_variants cv
      JOIN car_models cm ON cv.model_id = cm.model_id
      JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
      LEFT JOIN variant_features vf ON cv.variant_id = vf.variant_id
      ${l}
      GROUP BY 
        cv.variant_id,
        cv.variant_name,
        cv.model_id,
        cm.model_name,
        cm.body_type,
        m.manufacturer_id,
        m.name,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.transmission,
        cv.engine_displacement_cc,
        cv.power_bhp,
        cv.torque_nm,
        cv.mileage_kmpl,
        cv.safety_rating_ncap,
        cv.is_active,
        cv.created_at
      ORDER BY cv.variant_id DESC
      LIMIT $${c} OFFSET $${c+1};
    `;u.push(t,s);let p=await (0,o.I)(d,u);return a.NextResponse.json({success:!0,count:p.rows.length,data:p.rows})}catch(e){return console.error("Error in GET /api/admin/cars:",e),a.NextResponse.json({success:!1,error:"Failed to retrieve car variants",details:e.message},{status:500})}}async function p(e){let r=await l();if(!r.authorized)return a.NextResponse.json({success:!1,error:r.error},{status:403});let t=await o.d.connect();try{let{modelId:r,variantName:s,price:i,fuelType:n,transmission:o,engineDisplacementCc:c,powerBhp:l,torqueNm:d,mileageKmpl:p,safetyRating:m,featureIds:v=[]}=await e.json();if(!r||!s||void 0===i||!n||!o)return a.NextResponse.json({success:!1,error:"Missing required fields: modelId, variantName, price, fuelType, transmission are required."},{status:400});let h=Number(i);if(isNaN(h)||h<=0)return a.NextResponse.json({success:!1,error:"price must be a positive number"},{status:400});let _=null!=m?Number(m):null;if(null!==_&&(isNaN(_)||_<0||_>5))return a.NextResponse.json({success:!1,error:"safetyRating must be between 0.0 and 5.0"},{status:400});let f=`${s} ${n} ${o} ex-showroom ${h} INR safety ${_||"unrated"} stars`,g=await (0,u.ke)(f),N=`[${g.join(",")}]`;await t.query("BEGIN");let w=`
      INSERT INTO car_variants (
        model_id,
        variant_name,
        ex_showroom_price,
        fuel_type,
        transmission,
        engine_displacement_cc,
        power_bhp,
        torque_nm,
        mileage_kmpl,
        safety_rating_ncap,
        embedding
      ) VALUES (
        $1, $2, $3, $4::fuel_enum, $5::trans_enum, $6, $7, $8, $9, $10, $11::vector
      )
      RETURNING *;
    `,y=(await t.query(w,[r,s.trim(),h,n.trim(),o.trim(),c?Number(c):null,l?Number(l):null,d?Number(d):null,p?Number(p):null,_,N])).rows[0];if(Array.isArray(v)&&v.length>0)for(let e of v)await t.query(`INSERT INTO variant_features (variant_id, feature_id, is_standard)
           VALUES ($1, $2, TRUE)
           ON CONFLICT DO NOTHING`,[y.variant_id,e]);return await t.query("COMMIT"),a.NextResponse.json({success:!0,message:"Car variant created successfully",data:y},{status:201})}catch(e){return await t.query("ROLLBACK"),console.error("Error in POST /api/admin/cars:",e),a.NextResponse.json({success:!1,error:"Failed to create car variant",details:e.message},{status:500})}finally{t.release()}}async function m(e){let r=await l();if(!r.authorized)return a.NextResponse.json({success:!1,error:r.error},{status:403});try{let{variantId:r,...t}=await e.json();if(!r)return a.NextResponse.json({success:!1,error:"variantId is required to update a car variant"},{status:400});let s=[],i=[],n=1;if(void 0!==t.variantName&&(s.push(`variant_name = $${n}`),i.push(t.variantName.trim()),n++),void 0!==t.price){let e=Number(t.price);if(isNaN(e)||e<=0)return a.NextResponse.json({success:!1,error:"price must be positive"},{status:400});s.push(`ex_showroom_price = $${n}`),i.push(e),n++}if(void 0!==t.fuelType&&(s.push(`fuel_type = $${n}::fuel_enum`),i.push(t.fuelType),n++),void 0!==t.transmission&&(s.push(`transmission = $${n}::trans_enum`),i.push(t.transmission),n++),void 0!==t.engineDisplacementCc&&(s.push(`engine_displacement_cc = $${n}`),i.push(null!==t.engineDisplacementCc?Number(t.engineDisplacementCc):null),n++),void 0!==t.powerBhp&&(s.push(`power_bhp = $${n}`),i.push(null!==t.powerBhp?Number(t.powerBhp):null),n++),void 0!==t.torqueNm&&(s.push(`torque_nm = $${n}`),i.push(null!==t.torqueNm?Number(t.torqueNm):null),n++),void 0!==t.mileageKmpl&&(s.push(`mileage_kmpl = $${n}`),i.push(null!==t.mileageKmpl?Number(t.mileageKmpl):null),n++),void 0!==t.safetyRating){let e=null!==t.safetyRating?Number(t.safetyRating):null;if(null!==e&&(isNaN(e)||e<0||e>5))return a.NextResponse.json({success:!1,error:"safetyRating must be between 0.0 and 5.0"},{status:400});s.push(`safety_rating_ncap = $${n}`),i.push(e),n++}if(void 0!==t.isActive&&(s.push(`is_active = $${n}`),i.push(!!t.isActive),n++),0===s.length)return a.NextResponse.json({success:!1,error:"No valid update fields provided."},{status:400});i.push(r);let u=`
      UPDATE car_variants 
      SET ${s.join(", ")}
      WHERE variant_id = $${n}
      RETURNING *;
    `,c=await (0,o.I)(u,i);if(0===c.rows.length)return a.NextResponse.json({success:!1,error:`Car variant with ID ${r} not found`},{status:404});return a.NextResponse.json({success:!0,message:"Car variant updated successfully",data:c.rows[0]})}catch(e){return console.error("Error in PUT /api/admin/cars:",e),a.NextResponse.json({success:!1,error:"Failed to update car variant",details:e.message},{status:500})}}async function v(e){let r=await l();if(!r.authorized)return a.NextResponse.json({success:!1,error:r.error},{status:403});try{let{searchParams:r}=new URL(e.url),t=r.get("id"),s=null,i=!1;if(t)s=parseInt(t,10),i="true"===r.get("hard");else try{let r=await e.json();s=r.variantId?parseInt(r.variantId,10):null,i=!!r.hardDelete}catch{}if(!s||isNaN(s))return a.NextResponse.json({success:!1,error:"Missing or invalid variantId. Provide via query (?id=123) or JSON payload."},{status:400});if(i){let e=await (0,o.I)("DELETE FROM car_variants WHERE variant_id = $1 RETURNING variant_id, variant_name;",[s]);if(0===e.rows.length)return a.NextResponse.json({success:!1,error:`Variant with ID ${s} not found.`},{status:404});return a.NextResponse.json({success:!0,message:`Variant ${s} permanently deleted.`,deleted:e.rows[0]})}{let e=`
        UPDATE car_variants 
        SET is_active = FALSE 
        WHERE variant_id = $1 
        RETURNING variant_id, variant_name, is_active;
      `,r=await (0,o.I)(e,[s]);if(0===r.rows.length)return a.NextResponse.json({success:!1,error:`Variant with ID ${s} not found.`},{status:404});return a.NextResponse.json({success:!0,message:`Variant ${s} archived (is_active set to false).`,archived:r.rows[0]})}}catch(e){return console.error("Error in DELETE /api/admin/cars:",e),a.NextResponse.json({success:!1,error:"Failed to delete/archive car variant",details:e.message},{status:500})}}s()}catch(e){s(e)}})},95456:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.d(r,{L:()=>u});var a=t(53797),i=t(98691),n=t(75748),o=e([n]);n=(o.then?(await o)():o)[0];let u={providers:[(0,a.Z)({name:"Credentials",credentials:{email:{label:"Email",type:"email",placeholder:"rohan.patel@example.com"},password:{label:"Password",type:"password"}},async authorize(e){if(!e?.email||!e?.password)throw Error("Please enter both email and password");let r=e.email.trim().toLowerCase(),t=`
          SELECT user_id, full_name, email, password_hash, role
          FROM users
          WHERE LOWER(email) = $1
          LIMIT 1;
        `,s=(await (0,n.I)(t,[r])).rows[0];if(!s)throw Error("No user found with this email address");if(!await i.ZP.compare(e.password,s.password_hash))throw Error("Invalid password");let a=(s.role||"customer").toString().toUpperCase();return{id:s.user_id.toString(),user_id:s.user_id,userId:s.user_id,name:s.full_name,email:s.email,role:a}}})],callbacks:{jwt:async({token:e,user:r})=>(r&&(e.userId=r.id,e.user_id=r.user_id??r.id,e.role=r.role),e),session:async({session:e,token:r})=>(e.user&&(e.user.id=r.user_id||r.userId||r.sub,e.user.user_id=r.user_id||r.userId||r.sub,e.user.userId=r.userId||r.user_id,e.user.role=r.role||"CUSTOMER"),e)},session:{strategy:"jwt",maxAge:2592e3},pages:{signIn:"/login"},secret:process.env.NEXTAUTH_SECRET||"car-recommendation-dbms-nextauth-super-secret-key-2026"};s()}catch(e){s(e)}})},75748:(e,r,t)=>{t.a(e,async(e,s)=>{try{t.d(r,{I:()=>n,d:()=>u});var a=t(8678),i=e([a]);a=(i.then?(await i)():i)[0];let o=process.env.DATABASE_URL||"postgresql://postgres:postgres@localhost:5432/cardb",u=global.pgPool||new a.Pool({connectionString:o,max:10,idleTimeoutMillis:3e4,connectionTimeoutMillis:5e3});async function n(e,r){Date.now();try{let t=await u.query(e,r);return Date.now(),t}catch(t){throw console.error("Database query execution error:",{query:e,params:r,error:t}),t}}u.on("error",e=>{console.error("Unexpected error on idle PostgreSQL client:",e)}),s()}catch(e){s(e)}})},52303:(e,r,t)=>{t.d(r,{ke:()=>s});async function s(e){let r=(e||"").trim();if(!r)return Array(1536).fill(0);let t=process.env.OPENAI_API_KEY;if(t&&"your-openai-api-key-here"!==t)try{let e=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({input:r,model:"text-embedding-3-small",dimensions:1536})});if(e.ok){let r=await e.json();if(r?.data?.[0]?.embedding)return r.data[0].embedding}else{let r=await e.text();console.warn(`OpenAI embedding API returned status ${e.status}: ${r}. Using fallback.`)}}catch(e){console.warn("Network error calling OpenAI embedding API. Falling back to local embedding generator:",e)}return function(e){let r=(e||"").trim().toLowerCase(),t=Array(1536).fill(0),s=0;for(let e=0;e<r.length;e++)s=(s<<5)-s+r.charCodeAt(e)|0;let a=Math.abs(s)+1,i=/(safe|ncap|airbag|adas|brak|guard)/i.test(r)?1.5:1,n=/(electric|ev|battery|range|charge)/i.test(r)?1.8:1,o=/(suv|ground|high|4x4|awd)/i.test(r)?1.4:1,u=/(sunroof|leather|ventilated|jbl|luxury|screen)/i.test(r)?1.3:1,c=0;for(let e=1;e<=1536;e++){let s=.55*Math.sin(.031*e+.73*a)*i+.45*Math.cos(.017*e+.12*r.length)*n*o*u;c+=(s=Math.round(1e5*s)/1e5)*s,t[e-1]=s}let l=Math.sqrt(c)||1;return t.map(e=>Number((e/l).toFixed(6)))}(r)}}};var r=require("../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[276,972,691,790],()=>t(46552));module.exports=s})();