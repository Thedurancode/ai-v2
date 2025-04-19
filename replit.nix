{ pkgs }: {
  deps = [
    pkgs.curl
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.nodejs_20
    pkgs.nodePackages.npm
    pkgs.yarn
    pkgs.git
    pkgs.sqlite
  ];
  env = {
    PYTHONHOME = "${pkgs.python311}";
    PYTHONBIN = "${pkgs.python311}/bin/python3.11";
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