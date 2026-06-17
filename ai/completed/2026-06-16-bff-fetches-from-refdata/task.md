# BFF fetches from refdata
Add a `GET /vehicles` route on the BFF that fetches from refdata (`http://localhost:3001/vehicles`) and returns the list, typed with the shared `Vehicle` contract. Run it on port 3002 and confirm `web → bff → refdata` works via curl.
