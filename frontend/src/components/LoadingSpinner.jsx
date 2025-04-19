import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";

const LoadingSpinner = () => {

	const { isDarkMode } = useAuthStore();
	return (
		<div
			className={`min-h-screen flex items-center justify-center relative overflow-hidden 
			bg-gradient-to-br 
			${isDarkMode
					? "from-gray-900 via-green-900 to-emerald-900"
					: "from-gray-100 via-blue-100 to-blue-200"
				}`}
		>
			<motion.div
				className={`w-16 h-16 border-4 border-t-4 rounded-full 
				${isDarkMode
						? "border-green-200 border-t-green-500"
						: "border-blue-300 border-t-blue-500"
					}`}
				animate={{ rotate: 360 }}
				transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
			/>
		</div>
	);
};

export default LoadingSpinner;