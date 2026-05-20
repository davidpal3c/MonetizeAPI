# Company Risk Score API

Look up a company risk score, sanctions flags, ESG notes, and supplier notes from company name and domain.

## Endpoint

`POST /company-risk-score`

## Example request

```http
POST /company-risk-score
{
  "companyName": "Acme Corp",
  "domain": "acme.example"
}
```

## Example response

```json
{
  "riskScore": 42,
  "sanctionsFlags": [],
  "esgNotes": "...",
  "supplierNotes": "..."
}
```

## Usage

# Company Risk Score

Call `POST /company-risk-score` with `companyName` and `domain`.

Returns risk score, sanctions flags, ESG notes, and supplier notes.
