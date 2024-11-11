import Image from "next/image";
import Link from "next/link";
import React from "react";

const Logo = () => {
  return (
    <Link href="/">
      <div className=" items-center hidden lg:flex">
        <Image height={28} width={28} src={"/logo.svg"} alt="logo" />
        <p className=" font-semibold text-white text-2xl ml-2.5">Finance</p>
      </div>
    </Link>
  );
};

export default Logo;
