# Stock behavior

Stock tracking is disabled by default. In this mode, product create/update/stock
endpoints normalize stock to `999999`, orders do not reserve or restore stock,
and low-stock alerts are disabled.

After setting up this version, normalize products already in the database:

```powershell
npm run stock:unlimited
```

Run the same command again after `npm run db:seed` if the seed resets stock values.
The script refuses to run when `TRACK_STOCK=true`.

To enable real stock tracking later, set `TRACK_STOCK=true` in `.env` and restart
the server. Product updates and orders will then use the saved quantities and
low-stock alerts will be re-enabled.

The order form still caps each product at 100 units per order.
