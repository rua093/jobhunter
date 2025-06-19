import { Button, Divider, Form, Input,InputNumber, message, notification } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { callRegister } from 'config/api';
import styles from 'styles/auth.module.scss';
import { IUser } from '@/types/backend';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [isSubmit, setIsSubmit] = useState(false);

    const onFinish = async (values: any) => {
        const { name, email, password, age } = values;
        setIsSubmit(true);
        const res = await callRegister(name, email, password as string, +age);
        setIsSubmit(false);
        if (res?.data?.id) {
            message.success('Đăng ký tài khoản thành công!');
            navigate('/login')
        } else {
            notification.error({
                message: "Có lỗi xảy ra",
                description:
                    res.message && Array.isArray(res.message) ? res.message[0] : res.message,
                duration: 5
            })
        }
    };

    return (
        <div className={styles["register-page"]} >
            <main className={styles.main} >
                <div className={styles.container} >
                    <section className={styles.wrapper} >
                        <div className={styles.heading} >
                            <h2 className={`${styles.text} ${styles["text-large"]}`}> Đăng Ký Tài Khoản </h2>
                            < Divider />
                        </div>
                        < Form<IUser>
                            name="basic"
                            onFinish={onFinish}
                            autoComplete="off"
                        >
                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Họ tên"
                                name="name"
                                rules={[
                                    { required: true, message: 'Họ tên không được để trống!' },
                                    { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự!' },
                                    { max: 50, message: 'Họ tên không được quá 50 ký tự!' }
                                ]}
                            >
                                <Input placeholder="Nhập họ tên" />
                            </Form.Item>

                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: 'Email không được để trống!' },
                                    { type: 'email', message: 'Email không đúng định dạng!' }
                                ]}
                            >
                                <Input type='email' placeholder="Nhập email" />
                            </Form.Item>

                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Mật khẩu"
                                name="password"
                                rules={[
                                    { required: true, message: 'Mật khẩu không được để trống!' },
                                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                                ]}
                            >
                                <Input.Password placeholder="Nhập mật khẩu" />
                            </Form.Item>

                            <Form.Item
                                labelCol={{ span: 24 }}
                                label="Tuổi"
                                name="age"
                                rules={[
                                    { required: true, message: 'Tuổi không được để trống!' },
                                    { type: 'number', min: 16, max: 100, message: 'Tuổi phải từ 16 đến 100!' }
                                ]}
                            >
                                <InputNumber type='number' placeholder="Nhập tuổi" />
                            </Form.Item>

                            < Form.Item>
                                <Button type="primary" htmlType="submit" loading={isSubmit} style={{ width: '100%', height: '40px' }}>
                                    Đăng ký
                                </Button>
                            </Form.Item>
                            <Divider> Or </Divider>
                            <p className="text text-normal" > Đã có tài khoản ?
                                <span>
                                    <Link to='/login' > Đăng Nhập </Link>
                                </span>
                            </p>
                        </Form>
                    </section>
                </div>
            </main>
        </div>
    )
}

export default RegisterPage;