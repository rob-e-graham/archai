# cURL Examples

```bash
curl http://localhost:8787/api/health
```

```bash
curl -X POST http://localhost:8787/api/search \
  -H 'Content-Type: application/json' \
  -d '{"q":"robot","limit":5}'
```

```bash
curl -X POST http://localhost:8787/api/upload/draft \
  -H 'Content-Type: application/json' \
  -H 'x-archai-role: collections' \
  -d '{"ca_object_id":"FAMTEC_2026_0001","ca_object_title":"Test Media Work","item_type":"installation","subject_tags":"projection,interactive"}'
```

```bash
curl -X POST http://localhost:8787/api/chat/object \
  -H 'Content-Type: application/json' \
  -d '{"objectId":"FAMTEC_2018_0001","prompt":"How do you work?"}'
```

```bash
curl -X POST http://localhost:8787/api/pipeline/nightly-sync \
  -H 'Content-Type: application/json' \
  -H 'x-archai-role: admin' \
  -d '{}'
```
```
