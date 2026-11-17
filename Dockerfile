FROM debian:bookworm-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends g++ make && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY Makefile ./
COPY includes/ includes/
COPY src/ src/
RUN make release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6 && rm -rf /var/lib/apt/lists/*
COPY --from=build /src/build/lttx /usr/local/bin/lttx
USER 65532:65532
WORKDIR /etc/lottiex
EXPOSE 8080
ENTRYPOINT ["lttx"]
CMD ["run"]
