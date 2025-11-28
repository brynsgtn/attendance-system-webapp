import { useAuthStore } from "../store/authStore";

const Footer = () => {
  const { isDarkMode } = useAuthStore();

  return (
    <footer className={`
      bg-white 
      text-gray-700 
      dark:bg-gray-900 
      dark:text-gray-300 
      border-t 
      border-gray-200 
      dark:border-gray-700 
      py-12
    `}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-8">
          <p className={`
            block 
            font-extrabold 
            text-2xl 
            md:text-3xl 
            bg-gradient-to-r 
            text-transparent 
            bg-clip-text 
            ${isDarkMode
              ? "from-lime-400 to-emerald-500 hover:text-white"
              : "from-blue-600 to-indigo-500 hover:text-emerald-500"
            }
            transition-colors duration-300
          `}>
            Your Corporation Name
          </p>

        </div>

        <hr className="my-8 border-gray-300 dark:border-gray-700" />
        <div>
          <p className={`
        text-sm 
        text-center 
        ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
        font-medium
    `}>
            © {new Date().getFullYear()}
            <a
              href="https://brynsgtn-webportfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className={`
                ${isDarkMode ? 'text-emerald-400 hover:text-emerald-600' : 'text-blue-600 hover:text-blue-700'} 
                font-semibold
                transition-colors duration-200
                text-decoration-none
                text-xl
            `}
            >
              &nbsp;&nbsp;&lt;brynsgtn/&gt;
            </a>
            . All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;