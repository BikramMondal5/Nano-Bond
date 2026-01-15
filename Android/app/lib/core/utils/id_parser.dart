class IdParser {
  // Regex for 12-digit Aadhaar (xxxx xxxx xxxx)
  // Ensure not part of a larger number (like 16-digit card)
  static final RegExp _aadhaarRegex = RegExp(
    r'(?<!\d)[0-9]{4}\s[0-9]{4}\s[0-9]{4}(?!\d)',
  );

  // Regex for PAN (5 Letters, 4 Numbers, 1 Letter)
  static final RegExp _panRegex = RegExp(r'[A-Z]{5}[0-9]{4}[A-Z]{1}');

  // Regex for Date of Birth (DD/MM/YYYY)
  static final RegExp _dobRegex = RegExp(r'\d{2}/\d{2}/\d{4}');

  static Map<String, String> parseText(String scannedText) {
    Map<String, String> result = {"type": "UNKNOWN", "number": "", "dob": ""};

    final upperText = scannedText.toUpperCase();

    // 1. Detect Document Type & Number with Strict Keyword Validation

    // Aadhaar Check
    if (_aadhaarRegex.hasMatch(scannedText)) {
      bool hasKeywords =
          upperText.contains("GOVERNMENT OF INDIA") ||
          upperText.contains("UNIQUE IDENTIFICATION") ||
          upperText.contains("AADHAAR");

      if (hasKeywords) {
        result["type"] = "AADHAAR";
        result["number"] = _aadhaarRegex.firstMatch(scannedText)!.group(0)!;
      }
    }

    // PAN Check (only if not recognized as Aadhaar)
    if (result["type"] == "UNKNOWN" && _panRegex.hasMatch(scannedText)) {
      bool hasKeywords =
          upperText.contains("INCOME TAX") ||
          upperText.contains("GOVT. OF INDIA") ||
          upperText.contains("PERMANENT ACCOUNT NUMBER");

      if (hasKeywords) {
        result["type"] = "PAN";
        result["number"] = _panRegex.firstMatch(scannedText)!.group(0)!;
      }
    }

    // 2. Extract DOB (Common to both)
    if (_dobRegex.hasMatch(scannedText)) {
      result["dob"] = _dobRegex.firstMatch(scannedText)!.group(0)!;
    }

    return result;
  }
}
