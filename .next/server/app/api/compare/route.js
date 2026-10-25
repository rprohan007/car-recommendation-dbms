"use strict";(()=>{var e={};e.id=90,e.ids=[90],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8678:e=>{e.exports=import("pg")},4373:(e,r,a)=>{a.a(e,async(e,t)=>{try{a.r(r),a.d(r,{originalPathname:()=>l,patchFetch:()=>u,requestAsyncStorage:()=>d,routeModule:()=>m,serverHooks:()=>_,staticGenerationAsyncStorage:()=>p});var s=a(49303),n=a(88716),o=a(60670),i=a(78516),c=e([i]);i=(c.then?(await c)():c)[0];let m=new s.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/compare/route",pathname:"/api/compare",filename:"route",bundlePath:"app/api/compare/route"},resolvedPagePath:"/Users/rohanrp/DBMS mini project/src/app/api/compare/route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:d,staticGenerationAsyncStorage:p,serverHooks:_}=m,l="/api/compare/route";function u(){return(0,o.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:p})}t()}catch(e){t(e)}})},78516:(e,r,a)=>{a.a(e,async(e,t)=>{try{a.r(r),a.d(r,{GET:()=>i,dynamic:()=>c});var s=a(87070),n=a(75748),o=e([n]);n=(o.then?(await o)():o)[0];let c="force-dynamic";async function i(e){try{let{searchParams:r}=new URL(e.url),a=r.get("ids");if(!a||""===a.trim())return s.NextResponse.json({success:!1,error:'Missing required query parameter "ids". Please provide comma-separated IDs, e.g. /api/compare?ids=1,2,3'},{status:400});let t=a.split(",").map(e=>parseInt(e.trim(),10)).filter(e=>!isNaN(e)&&e>0);if(0===t.length)return s.NextResponse.json({success:!1,error:'No valid positive integer IDs provided in "ids" parameter.'},{status:400});if(t.length>6)return s.NextResponse.json({success:!1,error:"Cannot compare more than 6 vehicles simultaneously."},{status:400});let o=`
      SELECT 
        cv.variant_id,
        cv.variant_name,
        cm.model_id,
        cm.model_name,
        m.manufacturer_id,
        m.name AS manufacturer_name,
        m.country_origin,
        cm.body_type,
        cm.seating_capacity,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.transmission,
        cv.engine_displacement_cc,
        cv.power_bhp,
        cv.torque_nm,
        cv.mileage_kmpl,
        cv.safety_rating_ncap,
        COALESCE(
          ARRAY_AGG(f.feature_name ORDER BY f.category, f.feature_name) 
          FILTER (WHERE vf.is_standard = TRUE),
          '{}'
        ) AS standard_features,
        COALESCE(
          ARRAY_AGG(f.feature_name ORDER BY f.category, f.feature_name) 
          FILTER (WHERE vf.is_standard = FALSE),
          '{}'
        ) AS optional_features,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'feature_id', f.feature_id,
              'feature_name', f.feature_name,
              'category', f.category,
              'is_standard', vf.is_standard
            ) ORDER BY f.category, f.feature_name
          ) FILTER (WHERE f.feature_id IS NOT NULL),
          '[]'
        ) AS features_list
      FROM car_variants cv
      JOIN car_models cm ON cv.model_id = cm.model_id
      JOIN manufacturers m ON cm.manufacturer_id = m.manufacturer_id
      LEFT JOIN variant_features vf ON cv.variant_id = vf.variant_id
      LEFT JOIN features f ON vf.feature_id = f.feature_id
      WHERE cv.variant_id = ANY($1::int[])
      GROUP BY 
        cv.variant_id,
        cv.variant_name,
        cm.model_id,
        cm.model_name,
        m.manufacturer_id,
        m.name,
        m.country_origin,
        cm.body_type,
        cm.seating_capacity,
        cv.ex_showroom_price,
        cv.fuel_type,
        cv.transmission,
        cv.engine_displacement_cc,
        cv.power_bhp,
        cv.torque_nm,
        cv.mileage_kmpl,
        cv.safety_rating_ncap
      ORDER BY cv.ex_showroom_price ASC;
    `,i=await (0,n.I)(o,[t]);if(0===i.rows.length)return s.NextResponse.json({success:!1,error:"No car variants found matching the provided IDs.",requestedIds:t},{status:404});return s.NextResponse.json({success:!0,count:i.rows.length,requestedIds:t,data:i.rows})}catch(e){return console.error("Error in /api/compare:",e),s.NextResponse.json({success:!1,error:"Failed to retrieve car comparison data",details:void 0},{status:500})}}t()}catch(e){t(e)}})},75748:(e,r,a)=>{a.a(e,async(e,t)=>{try{a.d(r,{I:()=>o,d:()=>c});var s=a(8678),n=e([s]);s=(n.then?(await n)():n)[0];let i=process.env.DATABASE_URL||"postgresql://postgres:postgres@localhost:5432/cardb",c=global.pgPool||new s.Pool({connectionString:i,max:10,idleTimeoutMillis:3e4,connectionTimeoutMillis:5e3});async function o(e,r){Date.now();try{let a=await c.query(e,r);return Date.now(),a}catch(a){throw console.error("Database query execution error:",{query:e,params:r,error:a}),a}}c.on("error",e=>{console.error("Unexpected error on idle PostgreSQL client:",e)}),t()}catch(e){t(e)}})}};var r=require("../../../webpack-runtime.js");r.C(e);var a=e=>r(r.s=e),t=r.X(0,[276,972],()=>a(4373));module.exports=t})();