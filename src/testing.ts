import { ParserPipeline } from '@utils/pipeline_builder.ts';

export const instructionExamples: string[] = [
  // Primer grupo (1-40)
  "GRAPVH",
  "-item:ABCDE 1234",
  "brand:^120",
  'item:"MEXRC 0002"',
  "items:[RC$]20<>50",
  "line:ABC",
  "-brand:A1",
  "[PVH]>50",
  "item:<1000",
  'brand:"AB"',
  "keys:'A1B2C3'",
  "-items:1000<>2000",
  "[GRAPVH]>=250",
  'lines:"123"',
  "brand:A*B$",
  "item:<=200",
  "-key:12345",
  "[XYZ]^AB.*",
  "keys:[REGX]*123$",
  "lines:>500",
  '-items:"ABCDE1234"',
  "[CODE]1000<>9999",
  'brands:"^MX"',
  "items:[GR$]>1500",
  "key:ABCDE",
  "-lines:A1B",
  "item:ABCDEF1234",
  "[TAG]<300",
  "-brands:ABC",
  'keys:"ABCDE"',
  "[ITEMS]A1B2<>C3D4",
  "brand:<=Z9",
  "item:'12345 6789'",
  "[DATA]ABCD$",
  "lines:[NUM]>123",
  "-key:^XYZ.*",
  "brand:[B$]<20",
  "[AB]100<>500",
  "-items:ABCDE 6789",
  '"Descripción adicional de prueba"',

  // Segundo grupo (41-100)
  '-items:"ABCDE 5678"',
  "[KEYS]^Z.*",
  "brands:AB1",
  "[LINES]>999",
  "item:>=0050",
  "key:<ABCDE",
  "-lines:123",
  "[BRAND]A2B3<>C4D5",
  "items:[ABC*]200<>400",
  "line:'A2C'",
  "[XYZ]A.*Z$",
  "-brand:Z9",
  "keys:>=ABCDE",
  "[PVH$]<=250",
  '-item:"12345 6789"',
  "brands:[MX$]300<>600",
  "[ITEM]AB.*",
  "lines:ABC",
  "[CODE]<0001",
  "brand:>=A0",
  "-items:^A1.*",
  "key:'123ABC'",
  "[GR]>0999",
  "line:[L$]AAA<>ZZZ",
  'item:"A1B2C3D4E5"',
  "[ITEMS]<=500",
  "brands:^XY.*",
  "key:ABCDE",
  "[TAG]0010<>0020",
  "lines:<300",
  '-brand:"AA"',
  "[DATA]X1Y2$",
  "item:>9999",
  "-lines:'123'",
  "[BRAND]B.*",
  "items:[XY$]0500<>0600",
  "[KEYS]C1D2<>C9D9",
  "line:>=AAA",
  "brand:Z*",
  "[RC]<150",
  "-item:ABCDE1234",
  "keys:[K$]>200",
  "[NUM]>=050",
  "brands:<Z9",
  "line:'XYZ'",
  "[PVH]1000<>2000",
  "item:ABCDE 9876",
  "[REGEX]^[0-9]{4}$",
  "key:<XYZ12",
  "[ITEMS]999<>1000",
  "-brands:^A.*",
  "lines:[AB$]<300",
  "brand:>B2",
  "[DATA]^123.*",
  "item:'ABCDE6789'",
  "[LINES]ABC$",
  "key:<=X1Y2",
  "[ABC]>0010",
  "brands:AAA",
  '"Última descripción adicional"',
];

export const comprehensiveInstructions: string[] = [
  "line:MEX",
  "brand:H$",

  // Patrones dinámicos con prefijo complejo
  "items:[ACCSEH]>0050 molduras rojas",
  "-items:[PVH]<0300 accesorios de baño",
  "line:^ABC.* artículos cerámicos",
  "brand:[AB1]1000<>2000 grifería", // error
  "items:[^XYZ]0500 iluminación exterior",
  "-brand:[GRAPVH]^[A-Z]{3}$ fontanería", // error
  "[ITEMS][PVH$]>0200 madera pulida",
  "line:[L1N3]500<>750 pinturas interiores", // error
  "[BRAND]^[0-9]{2}$ accesorios automotrices",
  "-items:[ACC]200<>400 herramientas eléctricas",

  // Combinaciones regex complejas
  "brand:^1[0-9] items:>0100 tornillería", // error
  "items:[SEH$]<0250 pintura exterior blanca",
  "line:^[A-Z]{3}$ -items:[ABC]>0750 grifería premium", // error
  "[KEY]^[A-Z0-9]{6}$ puertas de seguridad",
  "-brand:^AB.* molduras estilo vintage items:<0500",
  "[ITEMS][XYZ$]^12.* accesorios modernos baño",
  "items:[CODE]^SEH.*>0300 iluminación LED", // error
  "brand:[BR]^[XYZ].* -items:1000<>1500 fontanería avanzada",
  "[KEY][1A2B3C]>0050 herramientas industriales",
  "line:[LIN]^[0-9A-Z]{4}$ -items:<1000 pinturas decorativas",

  // Mezcla intensa de rangos y comparaciones
  "items:>0500 items:<1000 accesorios cocina marca:[AC1]",
  "[ACC]0500<>0750 tornillos galvanizados",
  "-items:[PVH]0300<>0600 herramientas taller",
  "[BRAND][^ABC]400<>800 accesorios automóvil",
  "line:[XYZ]<0500 puertas madera premium",
  "-brand:[ZZZ]>1000 molduras decorativas clásicas",
  "[CODE][123$]0500<>0900 filtros industriales",
  "items:[PVH$]<=0200 grifería básica baño",
  "brand:^XY.* -items:>0700 pintura esmalte automotriz",
  "[ITEMS][MX$]>0300 iluminación residencial",

  // Expresiones mixtas con descripción intercalada
  "accesorios baño items:[ACCSEH]>0050 estilo moderno",
  "molduras items:[MDL]^[0-9]{4}$ decorativas",
  "herramientas industriales brand:[AB1]<0300 calidad premium",
  "llaves ajustables items:[PVH]0200<>0400 resistentes",
  "accesorios automóvil brand:^A[0-9]{2}$ calidad certificada",
  "line:[LN1]>0100 pintura mate interior",
  "-items:[XYZ]<0200 puertas de aluminio modernas",
  "brand:[ABC]^XYZ.* herramientas precisión",
  "[ITEMS][123]^[A-Z0-9]{4}$ filtros alto rendimiento",
  "key:[KEY]^[0-9A-Z]{5}$ iluminación decorativa",

  // Inclusiones y exclusiones combinadas agresivamente
  "items:[ACC]>0500 -items:[ACC]0750<>1000 accesorios eléctricos",
  "-brand:[ZZZ]<0200 molduras rústicas",
  "brand:[PVH]^P.*V$ items:>0300 herramientas de fontanería",
  "-line:[LN1]^[A-Z]{2}[0-9]{2}$ pinturas especializadas",
  "items:[CODE]<0600 filtros básicos",
  "brand:[MX]^[0-9]{3}$ iluminación moderna -items:>0800",
  "[ITEMS][^AB]0500<>1000 puertas reforzadas",
  "-key:[123ABC] herramientas básicas items:<0500",
  "line:[XYZ]^[0-9]{3}$ molduras clásicas",
  "items:[ACCSEH]1000<>1500 accesorios baño lujo",
];

// Función para comparar objetos JSON
// const deepEqual = (a: unknown, b: unknown): boolean =>
//   JSON.stringify(a) === JSON.stringify(b);

export async function comparePipelines() {
  for (const instruction of comprehensiveInstructions) {
    // // 1. Parsear usando InstructionParser
    // const instructionParser = new InstructionParser(instruction);
    // const parsedResult: ParsedResult = instructionParser.result;

    // // 2. Construir pipeline con SearchPipelineBuilder
    // const builder = new SearchPipelineBuilder();
    // const builderPipeline = builder.buildSearchPipeline(parsedResult);

    // 3. Obtener resultado de ParserPipeline
    const parserPipelineResult = await ParserPipeline
      .getPipelineForInstruction(instruction);

    console.log(`\n🔍 Analizando instrucción: \`${instruction}\``);
    console.log(JSON.stringify(parserPipelineResult, null, 2));
    // const parserPipelineParsedResult = parserPipelineResult.parseResult;
    // const parserPipelineStages = parserPipelineResult.pipeline;

    // // Comparaciones
    // const parsedResultEqual = deepEqual(
    //   parsedResult,
    //   parserPipelineParsedResult,
    // );
    // const pipelineStagesEqual = deepEqual(
    //   builderPipeline,
    //   parserPipelineStages,
    // );

    // console.log(`\n🔍 Comparando instrucción: "${instruction}"`);

    // if (parsedResultEqual) {
    //   console.log("✅ ParsedResult coinciden");
    // } else {
    //   console.error("❌ Diferencias encontradas en ParsedResult:");
    //   console.error(
    //     "InstructionParser:",
    //     JSON.stringify(parsedResult, null, 2),
    //   );
    //   console.error(
    //     "ParserPipeline:",
    //     JSON.stringify(parserPipelineParsedResult, null, 2),
    //   );
    // }

    // if (pipelineStagesEqual) {
    //   console.log("✅ PipelineStages coinciden");
    // } else {
    //   console.error("❌ Diferencias encontradas en PipelineStages:");
    //   console.error(
    //     "SearchPipelineBuilder:",
    //     JSON.stringify(builderPipeline, null, 2),
    //   );
    //   console.error(
    //     "ParserPipeline:",
    //     JSON.stringify(parserPipelineStages, null, 2),
    //   );
    // }
  }
}
