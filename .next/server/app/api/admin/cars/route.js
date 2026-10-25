"use strict";(()=>{var e={};e.id=893,e.ids=[893],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8678:e=>{e.exports=import("pg")},46552:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.r(t),a.d(t,{originalPathname:()=>v,patchFetch:()=>u,requestAsyncStorage:()=>d,routeModule:()=>l,serverHooks:()=>m,staticGenerationAsyncStorage:()=>p});var s=a(49303),n=a(88716),i=a(60670),o=a(57955),c=e([o]);o=(c.then?(await c)():c)[0];let l=new s.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/admin/cars/route",pathname:"/api/admin/cars",filename:"route",bundlePath:"app/api/admin/cars/route"},resolvedPagePath:"/Users/rohanrp/DBMS mini project/src/app/api/admin/cars/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:d,staticGenerationAsyncStorage:p,serverHooks:m}=l,v="/api/admin/cars/route";function u(){return(0,i.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:p})}r()}catch(e){r(e)}})},57955:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.r(t),a.d(t,{DELETE:()=>d,GET:()=>c,POST:()=>u,PUT:()=>l,dynamic:()=>p});var s=a(87070),n=a(75748),i=a(52303),o=e([n]);n=(o.then?(await o)():o)[0];let p="force-dynamic";async function c(e){try{let{searchParams:t}=new URL(e.url),a=Math.min(Math.max(parseInt(t.get("limit")||"50",10),1),100),r=Math.max(parseInt(t.get("offset")||"0",10),0),i=t.get("modelId"),o=[],c=[],u=1;i&&(o.push(`cv.model_id = $${u}`),c.push(parseInt(i,10)),u++);let l=o.length>0?`WHERE ${o.join(" AND ")}`:"",d=`
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
      LIMIT $${u} OFFSET $${u+1};
    `;c.push(a,r);let p=await (0,n.I)(d,c);return s.NextResponse.json({success:!0,count:p.rows.length,data:p.rows})}catch(e){return console.error("Error in GET /api/admin/cars:",e),s.NextResponse.json({success:!1,error:"Failed to retrieve car variants",details:e.message},{status:500})}}async function u(e){let t=await n.d.connect();try{let{modelId:a,variantName:r,price:n,fuelType:o,transmission:c,engineDisplacementCc:u,powerBhp:l,torqueNm:d,mileageKmpl:p,safetyRating:m,featureIds:v=[]}=await e.json();if(!a||!r||void 0===n||!o||!c)return s.NextResponse.json({success:!1,error:"Missing required fields: modelId, variantName, price, fuelType, transmission are required."},{status:400});let _=Number(n);if(isNaN(_)||_<=0)return s.NextResponse.json({success:!1,error:"price must be a positive number"},{status:400});let h=null!=m?Number(m):null;if(null!==h&&(isNaN(h)||h<0||h>5))return s.NextResponse.json({success:!1,error:"safetyRating must be between 0.0 and 5.0"},{status:400});let f=`${r} ${o} ${c} ex-showroom ${_} INR safety ${h||"unrated"} stars`,g=await (0,i.ke)(f),N=`[${g.join(",")}]`;await t.query("BEGIN");let y=`
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
    `,w=(await t.query(y,[a,r.trim(),_,o.trim(),c.trim(),u?Number(u):null,l?Number(l):null,d?Number(d):null,p?Number(p):null,h,N])).rows[0];if(Array.isArray(v)&&v.length>0)for(let e of v)await t.query(`INSERT INTO variant_features (variant_id, feature_id, is_standard)
           VALUES ($1, $2, TRUE)
           ON CONFLICT DO NOTHING`,[w.variant_id,e]);return await t.query("COMMIT"),s.NextResponse.json({success:!0,message:"Car variant created successfully",data:w},{status:201})}catch(e){return await t.query("ROLLBACK"),console.error("Error in POST /api/admin/cars:",e),s.NextResponse.json({success:!1,error:"Failed to create car variant",details:e.message},{status:500})}finally{t.release()}}async function l(e){try{let{variantId:t,...a}=await e.json();if(!t)return s.NextResponse.json({success:!1,error:"variantId is required to update a car variant"},{status:400});let r=[],i=[],o=1;if(void 0!==a.variantName&&(r.push(`variant_name = $${o}`),i.push(a.variantName.trim()),o++),void 0!==a.price){let e=Number(a.price);if(isNaN(e)||e<=0)return s.NextResponse.json({success:!1,error:"price must be positive"},{status:400});r.push(`ex_showroom_price = $${o}`),i.push(e),o++}if(void 0!==a.fuelType&&(r.push(`fuel_type = $${o}::fuel_enum`),i.push(a.fuelType),o++),void 0!==a.transmission&&(r.push(`transmission = $${o}::trans_enum`),i.push(a.transmission),o++),void 0!==a.engineDisplacementCc&&(r.push(`engine_displacement_cc = $${o}`),i.push(null!==a.engineDisplacementCc?Number(a.engineDisplacementCc):null),o++),void 0!==a.powerBhp&&(r.push(`power_bhp = $${o}`),i.push(null!==a.powerBhp?Number(a.powerBhp):null),o++),void 0!==a.torqueNm&&(r.push(`torque_nm = $${o}`),i.push(null!==a.torqueNm?Number(a.torqueNm):null),o++),void 0!==a.mileageKmpl&&(r.push(`mileage_kmpl = $${o}`),i.push(null!==a.mileageKmpl?Number(a.mileageKmpl):null),o++),void 0!==a.safetyRating){let e=null!==a.safetyRating?Number(a.safetyRating):null;if(null!==e&&(isNaN(e)||e<0||e>5))return s.NextResponse.json({success:!1,error:"safetyRating must be between 0.0 and 5.0"},{status:400});r.push(`safety_rating_ncap = $${o}`),i.push(e),o++}if(void 0!==a.isActive&&(r.push(`is_active = $${o}`),i.push(!!a.isActive),o++),0===r.length)return s.NextResponse.json({success:!1,error:"No valid update fields provided."},{status:400});i.push(t);let c=`
      UPDATE car_variants 
      SET ${r.join(", ")}
      WHERE variant_id = $${o}
      RETURNING *;
    `,u=await (0,n.I)(c,i);if(0===u.rows.length)return s.NextResponse.json({success:!1,error:`Car variant with ID ${t} not found`},{status:404});return s.NextResponse.json({success:!0,message:"Car variant updated successfully",data:u.rows[0]})}catch(e){return console.error("Error in PUT /api/admin/cars:",e),s.NextResponse.json({success:!1,error:"Failed to update car variant",details:e.message},{status:500})}}async function d(e){try{let{searchParams:t}=new URL(e.url),a=t.get("id"),r=null,i=!1;if(a)r=parseInt(a,10),i="true"===t.get("hard");else try{let t=await e.json();r=t.variantId?parseInt(t.variantId,10):null,i=!!t.hardDelete}catch{}if(!r||isNaN(r))return s.NextResponse.json({success:!1,error:"Missing or invalid variantId. Provide via query (?id=123) or JSON payload."},{status:400});if(i){let e=await (0,n.I)("DELETE FROM car_variants WHERE variant_id = $1 RETURNING variant_id, variant_name;",[r]);if(0===e.rows.length)return s.NextResponse.json({success:!1,error:`Variant with ID ${r} not found.`},{status:404});return s.NextResponse.json({success:!0,message:`Variant ${r} permanently deleted.`,deleted:e.rows[0]})}{let e=`
        UPDATE car_variants 
        SET is_active = FALSE 
        WHERE variant_id = $1 
        RETURNING variant_id, variant_name, is_active;
      `,t=await (0,n.I)(e,[r]);if(0===t.rows.length)return s.NextResponse.json({success:!1,error:`Variant with ID ${r} not found.`},{status:404});return s.NextResponse.json({success:!0,message:`Variant ${r} archived (is_active set to false).`,archived:t.rows[0]})}}catch(e){return console.error("Error in DELETE /api/admin/cars:",e),s.NextResponse.json({success:!1,error:"Failed to delete/archive car variant",details:e.message},{status:500})}}r()}catch(e){r(e)}})},75748:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.d(t,{I:()=>i,d:()=>c});var s=a(8678),n=e([s]);s=(n.then?(await n)():n)[0];let o=process.env.DATABASE_URL||"postgresql://postgres:postgres@localhost:5432/cardb",c=global.pgPool||new s.Pool({connectionString:o,max:10,idleTimeoutMillis:3e4,connectionTimeoutMillis:5e3});async function i(e,t){Date.now();try{let a=await c.query(e,t);return Date.now(),a}catch(a){throw console.error("Database query execution error:",{query:e,params:t,error:a}),a}}c.on("error",e=>{console.error("Unexpected error on idle PostgreSQL client:",e)}),r()}catch(e){r(e)}})},52303:(e,t,a)=>{a.d(t,{ke:()=>r});async function r(e){let t=(e||"").trim();if(!t)return Array(1536).fill(0);let a=process.env.OPENAI_API_KEY;if(a&&"your-openai-api-key-here"!==a)try{let e=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${a}`},body:JSON.stringify({input:t,model:"text-embedding-3-small",dimensions:1536})});if(e.ok){let t=await e.json();if(t?.data?.[0]?.embedding)return t.data[0].embedding}else{let t=await e.text();console.warn(`OpenAI embedding API returned status ${e.status}: ${t}. Using fallback.`)}}catch(e){console.warn("Network error calling OpenAI embedding API. Falling back to local embedding generator:",e)}return function(e){let t=(e||"").trim().toLowerCase(),a=Array(1536).fill(0),r=0;for(let e=0;e<t.length;e++)r=(r<<5)-r+t.charCodeAt(e)|0;let s=Math.abs(r)+1,n=/(safe|ncap|airbag|adas|brak|guard)/i.test(t)?1.5:1,i=/(electric|ev|battery|range|charge)/i.test(t)?1.8:1,o=/(suv|ground|high|4x4|awd)/i.test(t)?1.4:1,c=/(sunroof|leather|ventilated|jbl|luxury|screen)/i.test(t)?1.3:1,u=0;for(let e=1;e<=1536;e++){let r=.55*Math.sin(.031*e+.73*s)*n+.45*Math.cos(.017*e+.12*t.length)*i*o*c;u+=(r=Math.round(1e5*r)/1e5)*r,a[e-1]=r}let l=Math.sqrt(u)||1;return a.map(e=>Number((e/l).toFixed(6)))}(t)}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[276,972],()=>a(46552));module.exports=r})();