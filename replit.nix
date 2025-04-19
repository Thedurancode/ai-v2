{ pkgs }: {
  deps = [
    pkgs.python310
    pkgs.python310Packages.pip
    pkgs.nodejs_20
    pkgs.nodePackages.npm
    pkgs.yarn
    pkgs.git
    pkgs.sqlite
    pkgs.curl
  ];
  env = {
    PYTHONHOME = "${pkgs.python310}";
    PYTHONBIN = "${pkgs.python310}/bin/python3.10";
    LANG = "en_US.UTF-8";
    PYTHON_LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.libffi
      pkgs.zlib
    ];
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.libffi
      pkgs.zlib
    ];
  };
}