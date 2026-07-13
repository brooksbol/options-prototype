/**
 * Yahoo Top ETFs — bundled seed data.
 *
 * Source: Yahoo Finance "Top ETFs" list, captured July 13, 2026.
 *
 * This is an externally curated ETF candidate snapshot.
 * It is NOT:
 *   - a complete ETF market universe
 *   - a neutral or unbiased registry
 *   - an institutionally approved list
 *   - a current options-opportunity ranking
 *
 * The source is influenced by historical fund quality, risk-adjusted
 * performance, expenses, momentum, and trading characteristics
 * (likely via upstream Morningstar ratings/grades).
 *
 * Inclusion does not imply institutional admission or suitability
 * for options overlay deployment.
 */

export const YAHOO_SOURCE_ID = "yahoo_top_etfs_2026_07_13";
export const YAHOO_CAPTURED_AT = "2026-07-13";
export const YAHOO_DISPLAY_NAME = "Yahoo Top ETFs";
export const YAHOO_DESCRIPTION = "Externally curated Yahoo ETF snapshot captured July 13, 2026. Not a complete ETF market universe. Inclusion does not imply institutional admission or suitability.";

/**
 * 496 ETF symbols from Yahoo Finance "Top ETFs" list.
 * Sorted alphabetically for deterministic behavior.
 */
export const YAHOO_TOP_ETFS: string[] = [
  "AAVM", "ABFL", "ACWI", "AIA", "AIRR", "AMUN", "ANGL", "AOA", "AOK", "AOM",
  "AOR", "ARKQ", "ARKW", "ASHS", "ATMP", "AUSF", "BAPR", "BBC", "BBP", "BBRE",
  "BCPL", "BEDY", "BFOR", "BIV", "BJAN", "BJUL", "BKFI", "BLOK", "BMOP", "BOCT",
  "BOUT", "CAM", "CEFS", "CNXT", "COLO", "COMT", "COPX", "CRAK", "CRBN", "CRUX",
  "CSD", "CSEN", "CWI", "DBAW", "DBEF", "DBEM", "DBEU", "DBEZ", "DBJP", "DDIV",
  "DFNL", "DGRO", "DGT", "DIA", "DIEM", "DIVB", "DIVI", "DIVO", "DJD", "DLN",
  "DRSK", "DSI", "DUSA", "DVLU", "DWAS", "DXJ", "DYNF", "ECH", "EES", "EFAS",
  "EFV", "EINC", "EMBX", "EMCR", "EMGF", "EMHY", "EMMF", "EMXC", "ENFR", "EPI",
  "EPS", "EPU", "EQL", "EQRR", "EQWL", "ESGG", "ETHO", "EUFN", "EVMO", "EWC",
  "EWD", "EWJV", "EWL", "EWM", "EWT", "EYLD", "EZA", "EZM", "EZU", "FAD",
  "FALN", "FBND", "FBT", "FCA", "FCEF", "FCOR", "FDD", "FDEM", "FDIS", "FDM",
  "FDMO", "FDRR", "FDT", "FDVV", "FEUZ", "FEZ", "FFIU", "FIVA", "FLBR", "FLEU",
  "FLHY", "FLJH", "FLLA", "FLMI", "FLMX", "FLN", "FLOT", "FLQL", "FLRN", "FLRT",
  "FLTR", "FLTW", "FMB", "FNCL", "FNDB", "FNDE", "FNDF", "FNDX", "FNX", "FNY",
  "FPA", "FPE", "FPEI", "FPX", "FPXI", "FRI", "FSMD", "FSTA", "FTA", "FTEC",
  "FTGC", "FTLS", "FTQI", "FTSD", "FTXH", "FTXL", "FTXO", "FV", "FVAL", "FVC",
  "FXO", "FXU", "FYC", "FYLD", "FYX", "GAL", "GDMA", "GII", "GLD", "GLOF",
  "GOEX", "GOVI", "GQRE", "GRID", "GSG", "GSGO", "GSY", "GUSE", "GVAL", "GVIP",
  "GVLE", "HAP", "HAWX", "HEDJ", "HEEM", "HEFA", "HEWJ", "HEZU", "HFXI", "HMOP",
  "HSCZ", "HTUS", "HYDB", "HYEM", "HYGH", "HYHG", "HYS", "HYUP", "HYZD", "IAI",
  "IAK", "IAU", "IBD", "ICVT", "IDHQ", "IDMO", "IDX", "IEDI", "IEF", "IEI",
  "IEO", "IFRA", "IGBH", "IGEB", "IGF", "IGHG", "IGIB", "IGLB", "IGM", "IGSB",
  "IHDG", "IHE", "IJK", "ILCG", "IMCG", "IMTM", "INCO", "INTF", "IOO", "IPAC",
  "IQDY", "ISCF", "ISMD", "ITA", "ITB", "IUS", "IUSG", "IVLU", "IVOG", "IVV",
  "IVW", "IWB", "IWC", "IWF", "IWL", "IWP", "IWX", "IWY", "IXC", "IXG",
  "IXN", "IXUS", "IYF", "IYG", "IYK", "IYW", "JCPB", "JDIV", "JHMM", "JMBS",
  "JMOM", "JMST", "JPIB", "JPUS", "JQUA", "JSMD", "JSML", "JVAL", "KBA", "KBWB",
  "KCE", "KNCT", "KORP", "LEAD", "LEGR", "LEND", "LGOV", "LKOR", "LMBS", "LQDH",
  "LQDI", "LRGF", "LSAF", "LVDS", "LVHI", "MAGA", "MBSD", "MDYG", "MEAR", "MFDX",
  "MFUS", "MGC", "MGK", "MGV", "MLPX", "MMIN", "MMIT", "MTUM", "NACP", "NANR",
  "NEAR", "NLR", "NTSX", "NUAG", "NULG", "NYM", "OCIO", "OEF", "ONEO", "ONEQ",
  "ONEY", "OPPE", "OPPJ", "PAVE", "PBTP", "PBUS", "PEXL", "PFFA", "PICK", "PIZ",
  "PJUL", "PKB", "PKW", "POCT", "POWR", "PPA", "PREF", "PRF", "PRFZ", "PRN",
  "PSC", "PSCI", "PSCM", "PSI", "PSL", "PTF", "PTH", "PULS", "PWB", "PWV",
  "PXF", "QDEF", "QDF", "QINT", "QLC", "QLD", "QMOM", "QQQ", "QTUM", "QVAL",
  "QVMT", "QYLD", "RAAX", "RDIV", "RDVY", "REZ", "RFDA", "RFG", "RFV", "RINF",
  "RING", "RLY", "ROAM", "ROKT", "ROSC", "ROUS", "RPV", "RSPG", "RSPU", "RTH",
  "RWJ", "RWK", "RWL", "RWO", "RWR", "RZV", "SBIO", "SCHA", "SCHF", "SCHG",
  "SCHR", "SCHX", "SDCI", "SDVY", "SHYL", "SJNK", "SKOR", "SLQD", "SLX", "SMH",
  "SMIN", "SMLF", "SMLV", "SMMU", "SOXX", "SPDW", "SPGM", "SPGP", "SPHB", "SPHQ",
  "SPHY", "SPIB", "SPIT", "SPMO", "SPSB", "SPTI", "SPTM", "SPTS", "SPVM", "SPXE",
  "SPXN", "SPXV", "SPY", "SPYG", "SPYM", "SPYX", "STIP", "SUSA", "SYLD", "SYSB",
  "TDTF", "THD", "TLH", "TMFC", "TOK", "TUR", "UFOX", "UITB", "ULVM", "URA",
  "URTH", "USCI", "USMC", "USRT", "USSG", "USTB", "USVM", "UTES", "VCIT", "VCLT",
  "VCR", "VCSH", "VDC", "VDE", "VEA", "VEU", "VFH", "VFMF", "VFMO", "VFVA",
  "VGIT", "VGSH", "VGT", "VHT", "VLU", "VLUE", "VMBS", "VNLA", "VONE", "VONG",
  "VOO", "VOOG", "VPL", "VRAI", "VRIG", "VRP", "VT", "VTIP", "VTV", "VUG",
  "VV", "VYMI", "WLDR", "WTV", "XAGG", "XAR", "XBI", "XCEM", "XHB", "XLE",
  "XLF", "XLG", "XLK", "XLP", "XME", "XMHQ", "XMMO", "XMVM", "XNTK", "XSD",
  "XSMO", "XSVM", "XTL", "YLD", "YLDE", "YYY",
];
