{
  description = "Better Go Playground development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { nixpkgs, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "aarch64-darwin" ];
    in
    {
      devShells = nixpkgs.lib.genAttrs systems (system:
        let
          pkgs = import nixpkgs { inherit system; };
          packageManager = (builtins.fromJSON (builtins.readFile ./web/package.json)).packageManager;
          yarn = pkgs.writeShellScriptBin "yarn" ''
            exec ${pkgs.corepack}/bin/corepack ${packageManager} "$@"
          '';
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              yarn
              go_1_26
              nodejs_22
              corepack
              gnumake
              git
              gcc
              mockgen
              protobuf
              protoc-gen-go
              protoc-gen-go-grpc
            ];

            # Use the pinned compiler instead of downloading another Go toolchain.
            GOTOOLCHAIN = "local";
          };
        });
    };
}
