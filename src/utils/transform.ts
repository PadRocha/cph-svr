export const transform: (desc: string) => string = function (desc) {
  const aliases = [
    "cseh",
    "garbo",
    "ricoy",
    "sta?r",
    "gim?b?e?l?",
    "pucheta",
    "quezada",
    "CSYA",
    "CYSA",
    "herd?",
    "lemans",
    "optimo",
    "mane",
    "dai",
    "zaldivar",
    "norik",
    "le?ga?zpi?(\\w+)?",
    "tepeyac",
    "burgos",
    "ver",
    "obs?",
  ].join("|");
  const abbreviations = [
    "aea",
    "ae",
    "seh",
    "sag",
    "gbo",
    "rp",
    "jb",
    "cp",
    "ca",
    "ama",
    "ahm",
    "ggd",
    "qz",
    "ta",
    "hz",
    "hm",
    "opt",
    "eun",
    "jp",
    "tp",
    "qzd",
    "bp",
    "nhz",
    "kgt",
    "sg",
    "gb",
    "tep",
    "gp",
    "sgp",
    "aps",
  ]
    .map((value) => {
      const pointers = "(\\.|,|:)?";
      return value.split("").join(pointers) + pointers;
    })
    .join("|");
  const exceptions = [
    "cta",
    "cuello",
    "tacoma",
    "escape",
    "forma",
    "parecida",
    "exterior",
    "desconocida",
    "hueco",
    "jaladera",
    "toyota",
    "mazda",
    "cafe",
    "gris",
    "ngo",
    "negro",
    "azul",
    "rojo",
    "naranja",
    "rosa",
    "morado",
    "violeta",
    "marino",
    "blanco",
    "blanco",
    "amarillo",
    "derecha",
    "izquierda",
    "jgo",
    "juego",
    "gde",
    "grande",
    "larga",
    "corta",
    "chica",
    "pistola",
    "delantero",
    "trasero",
    "cromado",
    "redoondo",
    "cuadrado",
    "velocidades",
    "original",
    "economico",
    "modelo",
    "superior",
    "inferior",
    "tramo",
    "ranger",
    "plastico",
    "silicon",
    "similar",
    "forma",
    "color",
    "dedal",
    "ovalo",
  ]
    .map((value) => {
      return `[${value}]`;
    })
    .join("|");
  const pattern = "0-9A-Z-=\\/\\.";
  const RGX_1 =
    `\\(+(\\s+)?(${aliases}|${abbreviations})(?!${exceptions})(\\s|-)?[${pattern}]*(\\s+)?\\)+`;
  const RGX_2 =
    `\\(+(\\s+)?[${pattern}]*(?!${exceptions})(\\s|-)?(${aliases}|${abbreviations})(\\s+)?\\)+`;
  const RGX_3 =
    `\\(+(\\s+)?(${aliases}|${abbreviations})(?!${exceptions})(\\s|-)?[${pattern}]*`;
  const RGX_4 =
    `\\b(${aliases}|${abbreviations})(?!${exceptions})[${pattern}]+`;
  return desc
    .replace(
      new RegExp(`(${RGX_1})|(${RGX_2})|(${RGX_3})|(${RGX_4})`, "gi"),
      " ",
    )
    .replace(/(\(+(\s+)?[0-9\/-]*(\s+)?\)+)|(\(+(\s+)?[0-9\/-]*$)/g, " ")
    .replace(/(\W)\1+/g, "$1")
    .replace(/(\w)(\s+)(\)|\.|,)/g, "$1$3")
    .replace(/(\()(\s+)(\w)/g, "$1$3")
    .replace(/(\w|\.|")(\()/g, "$1 $2")
    .replace(/(\))(\w|\()/g, "$1 $2")
    .replace(/(,)(\w)/g, "$1 $2")
    .trim()
    .toLowerCase()
    .replace(/(?:^|\s|["'([{/.])+\S/g, (match) => match.toUpperCase())
    .replace(
      /\b(M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}))\b(?!\/|-|\.)/gi,
      (match) => match.toUpperCase(),
    );
};
