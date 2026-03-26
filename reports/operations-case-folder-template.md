# Шаблон структуры папки по объекту

Рекомендуемая структура папки по каждому кейсу:

```text
CASE-YYYYMMDD-CLIENT-ADDRESS/
├── 00-intake/
│   ├── request.md
│   ├── client-data.md
│   └── listing-link.txt
├── 01-docs-from-client/
├── 02-source-checks/
│   ├── egrn/
│   ├── seller/
│   ├── courts/
│   ├── bankruptcy/
│   └── notes.md
├── 03-analysis/
│   ├── working-notes.md
│   ├── red-flags.md
│   └── missing-docs.md
├── 04-delivery/
│   ├── short-result.md
│   ├── final-report.md
│   └── final-message.md
└── 05-archive/
```

## Назначение папок
- **00-intake** — всё, что пришло на входе
- **01-docs-from-client** — документы от клиента / продавца
- **02-source-checks** — выгрузки и результаты проверок
- **03-analysis** — рабочая аналитика
- **04-delivery** — итоговая клиентская выдача
- **05-archive** — устаревшие версии и промежуточные материалы
