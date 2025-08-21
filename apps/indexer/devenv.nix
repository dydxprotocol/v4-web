{
  config,
  lib,
  pkgs,
  ...
}:

{
  scripts = {

    build-indexer = {
      description = "Build the squid project";
      exec = ''
        tsc
      '';
    };

    generate = {
      description = "Generate a squid from an ABI file";
      exec = ''
        squid-gen-abi
      '';
    };

    codegen = {
      description = "Generate TypeORM entities from the schema file";
      exec = ''
        squid-typeorm-codegen
      '';
    };

    typegen = {
      description = "Generate data access classes for an ABI file(s) in the ./abi folder";
      exec = ''
        squid-evm-typegen ${config.env.DEVENV_ROOT}/src/abi --multicall
      '';
    };

    process = {
      description = "Load .env and start the squid processor";
      exec = ''
        tsx ${config.env.DEVENV_ROOT}/indexer/src/main.ts
      '';
    };

    serve = {
      description = "Start the GraphQL API server";
      exec = ''
        squid-graphql-server
      '';
    };

    serve-prod = {
      description = "Start the GraphQL API server with caching and limits";
      exec = ''
        squid-graphql-server --dumb-cache in-memory --dumb-cache-ttl 1000 --dumb-cache-size 100 --dumb-cache-max-age 1000
      '';
    };

    migrate = {
      description = "Apply the DB migrations";
      exec = ''
        squid-typeorm-migration create
      '';
    };

    migrate-apply = {
      description = "Apply the DB migrations";
      exec = ''
        squid-typeorm-migration apply
      '';
    };

    migrate-clean = {
      description = "Clean the migrations folder";
      exec = ''
        rm -rf "${config.env.DEVENV_ROOT}/indexer/db/migrations"
      '';
    };
  };

  services.postgres = {
    enable = true;
    package = pkgs.postgresql_17;
    port = 5432;
    listen_addresses = "*";
    initialDatabases = [
      {
        name = "postgres";
        user = "postgres";
        pass = "postgres";
      }
    ];
    # hbaConf = "pg_hba.conf";
    settings = {
      shared_buffers = "128MB";
      dynamic_shared_memory_type = "posix";
      max_wal_size = "1GB";
      min_wal_size = "80MB";
      datestyle = "iso, mdy";
      lc_messages = "en_US.UTF-8";
      lc_monetary = "en_US.UTF-8";
      lc_numeric = "en_US.UTF-8";
      lc_time = "en_US.UTF-8";
      default_text_search_config = "pg_catalog.english";
    };
  };
}
